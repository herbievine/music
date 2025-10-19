import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import z from "zod";
import { spotifyClient } from "../lib/spotify.js";
import { fetcher } from "../utils/fetcher.js";

const app = new Hono();

export default app.get("/play/:spotifyId", async (c) => {
	const auth = getAuth(c);
	const client = c.get("clerk");

	if (!auth?.userId) {
		return c.json({ message: "Not logged in" }, 400);
	}

	const oauthTokens = await client.users.getUserOauthAccessToken(
		auth.userId,
		"spotify",
	);

	if (oauthTokens.totalCount === 0) {
		return c.json({ message: "No oauth token" }, 400);
	}

	const { token } = oauthTokens.data[0];
	const spotifyId = c.req.param("spotifyId");
	const nextSpotifyId = c.req.query("next");

	const audioPromise = fetcher(
		`${process.env.HAXEL_API_URL}/${spotifyId}`,
		z.object({
			url: z.string().url(),
		}),
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	const trackPromise = spotifyClient(token).tracks.get(spotifyId);

	if (nextSpotifyId) {
		fetch(`${process.env.HAXEL_API_URL}/${nextSpotifyId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	}

	const [{ url }, track] = await Promise.all([audioPromise, trackPromise]);

	return c.json({
		url,
		track,
	});
});
