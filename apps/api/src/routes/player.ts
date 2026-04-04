import { Hono } from "hono";
import z from "zod";
import { getMusicProvider, getOAuthToken } from "../lib/middleware.js";
import { fetcher } from "../utils/fetcher.js";

const app = new Hono();

export default app.get("/play/:spotifyId", async (c) => {
	const provider = getMusicProvider(c);
	const oauthToken = getOAuthToken(c);
	const spotifyId = c.req.param("spotifyId");
	const nextSpotifyId = c.req.query("next");

	const audioPromise = fetcher(
		`${process.env.HAXEL_API_URL}/${spotifyId}`,
		z.object({
			url: z.string().url(),
		}),
		{
			headers: {
				Authorization: `Bearer ${oauthToken}`,
			},
		},
	);

	const trackPromise = provider.getTrack(spotifyId);

	if (nextSpotifyId) {
		fetch(`${process.env.HAXEL_API_URL}/${nextSpotifyId}`, {
			headers: {
				Authorization: `Bearer ${oauthToken}`,
			},
		});
	}

	const [{ url }, track] = await Promise.all([audioPromise, trackPromise]);

	return c.json({ url, track });
});
