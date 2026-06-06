import { Hono } from "hono";
import z from "zod";
import { db } from "../db/index.js";
import { playHistory } from "../db/schema.js";
import { getMusicProvider, getOAuthToken, getUserId } from "../lib/middleware.js";
import { fetcher } from "../utils/fetcher.js";

const app = new Hono();

export default app.get("/play/:spotifyId", async (c) => {
	const provider = getMusicProvider(c);
	const oauthToken = getOAuthToken(c);
	const spotifyId = c.req.param("spotifyId");
	const nextSpotifyId = c.req.query("next");
	const youtubeVideoId = c.req.query("youtubeVideoId");

	const params = new URLSearchParams();
	if (youtubeVideoId) {
		params.append("youtubeVideoId", youtubeVideoId);
	}
	const queryString = params.toString();
	const haxelUrl = `${process.env.HAXEL_API_URL}/${spotifyId}${queryString ? `?${queryString}` : ""}`;

	const audioPromise = fetcher(
		haxelUrl,
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

	const userId = getUserId(c);
	db.insert(playHistory)
		.values({
			userId,
			trackId: spotifyId,
			metadata: {
				name: track.name,
				artists: track.artists,
				album: track.album,
				durationMs: track.durationMs,
			},
		})
		.catch((err) => console.error("Failed to record play history:", err));

	return c.json({ url, track });
});
