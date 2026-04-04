import { Hono } from "hono";
import z from "zod";
import { getMusicProvider, getOAuthToken } from "../lib/middleware.js";
import { fetcher } from "../utils/fetcher.js";

const app = new Hono();

app.patch("/play/:spotifyId", async (c) => {
	const oauthToken = getOAuthToken(c);
	const spotifyId = c.req.param("spotifyId");
	const { youtubeVideoId } = await c.req.json<{ youtubeVideoId: string }>();

	if (!youtubeVideoId) {
		return c.json({ error: "youtubeVideoId is required" }, 400);
	}

	try {
		const res = await fetch(`${process.env.HAXEL_API_URL}/${spotifyId}`, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${oauthToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ youtubeVideoId }),
		});

		if (!res.ok) {
			throw new Error(`Haxel PATCH failed: ${res.status}`);
		}

		return c.json({ ok: true });
	} catch (error) {
		console.error("Error fixing YouTube URL:", error);
		return c.json({ error: "Failed to fix YouTube URL" }, 500);
	}
});

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
