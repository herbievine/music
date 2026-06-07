import { Hono } from "hono";
import z from "zod";
import { db } from "../db/index.js";
import { playHistory } from "../db/schema.js";
import { getTrackFromDb, upsertTrack } from "../lib/ingest.js";
import { getMusicProvider, getOAuthToken, getUserId } from "../lib/middleware.js";
import type { MusicTrack } from "../types.js";
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

	if (nextSpotifyId) {
		fetch(`${process.env.HAXEL_API_URL}/${nextSpotifyId}`, {
			headers: {
				Authorization: `Bearer ${oauthToken}`,
			},
		});
	}

	// Serve the track from the replica when available; refresh it in the background.
	// On a miss, fetch live and replicate before responding.
	const cached = await getTrackFromDb(spotifyId);
	let track: MusicTrack;
	if (cached) {
		track = cached;
		provider
			.getTrack(spotifyId)
			.then(upsertTrack)
			.catch((err) => console.error("Track replica update failed:", err));
	} else {
		track = await provider.getTrack(spotifyId);
		await upsertTrack(track);
	}

	const { url } = await audioPromise;

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
