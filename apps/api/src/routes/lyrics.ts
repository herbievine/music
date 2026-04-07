import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();

interface LyricsResponse {
	plain: string | null;
	synced: string | null;
	source: "lrclib" | "genius" | "none";
}

async function fetchFromLrclib(
	artistName: string,
	trackName: string,
	durationSeconds: number,
): Promise<LyricsResponse | null> {
	try {
		const res = await fetch(
			`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackName)}&duration=${durationSeconds}`,
		);

		if (!res.ok) return null;

		const data = await res.json();

		return {
			plain: data.plainLyrics || null,
			synced: data.syncedLyrics || null,
			source: "lrclib",
		};
	} catch (err) {
		return null;
	}
}

async function fetchFromGenius(
	artistName: string,
	trackName: string,
): Promise<LyricsResponse | null> {
	try {
		const geniusToken = process.env.GENIUS_ACCESS_TOKEN;
		if (!geniusToken) return null;

		// Search for the song
		const searchRes = await fetch(
			`https://api.genius.com/search?q=${encodeURIComponent(`${trackName} ${artistName}`)}`,
			{
				headers: {
					Authorization: `Bearer ${geniusToken}`,
				},
			},
		);

		if (!searchRes.ok) return null;

		const searchData = await searchRes.json();
		const hit = searchData.response?.hits?.[0]?.result;

		if (!hit?.url) return null;

		// Fetch the lyrics page
		const pageRes = await fetch(hit.url);
		if (!pageRes.ok) return null;

		const html = await pageRes.text();

		// Extract lyrics from [data-lyrics-container="true"] divs
		const lyricsMatches = html.match(
			/<div[^>]*data-lyrics-container="true"[^>]*>[\s\S]*?<\/div>/g,
		);

		if (!lyricsMatches || lyricsMatches.length === 0) {
			return null;
		}

		// Remove HTML tags and decode entities
		const lyrics = lyricsMatches
			.map((match) => {
				return match
					.replace(/<[^>]*>/g, "")
					.replace(/&nbsp;/g, " ")
					.replace(/&quot;/g, '"')
					.replace(/&apos;/g, "'")
					.replace(/&amp;/g, "&")
					.trim();
			})
			.filter((l) => l.length > 0)
			.join("\n\n");

		return {
			plain: lyrics || null,
			synced: null,
			source: "genius",
		};
	} catch (err) {
		return null;
	}
}

export default app.get(
	"/",
	zValidator(
		"query",
		z.object({
			trackId: z.string(),
			title: z.string(),
			artist: z.string(),
			durationSeconds: z.string(),
		}),
	),
	async (c) => {
		const query = c.req.valid("query");
		const durationSeconds = parseInt(query.durationSeconds, 10) || 0;

		// Try LRCLIB first
		const lyricsResponse = await fetchFromLrclib(
			query.artist,
			query.title,
			durationSeconds,
		);

		if (lyricsResponse && (lyricsResponse.plain || lyricsResponse.synced)) {
			return c.json(lyricsResponse);
		}

		// Fall back to Genius
		const geniusResponse = await fetchFromGenius(query.artist, query.title);

		if (geniusResponse && geniusResponse.plain) {
			return c.json(geniusResponse);
		}

		// No lyrics found
		return c.json({
			plain: null,
			synced: null,
			source: "none",
		});
	},
);
