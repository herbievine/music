import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getAlbumFromDb, upsertAlbum } from "../lib/ingest.js";
import { getMusicProvider, getOAuthToken } from "../lib/middleware.js";

const app = new Hono();
const SPOTIFY_API = "https://api.spotify.com/v1";

async function spotifyFetch(endpoint: string, token: string, options?: RequestInit) {
	const res = await fetch(`${SPOTIFY_API}${endpoint}`, {
		...options,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			...options?.headers,
		},
	});

	if (!res.ok) {
		const errorBody = await res.text();
		console.error(`Spotify API error: ${res.status} ${res.statusText}`, errorBody);
		throw new Error(`Spotify API error: ${res.status} ${res.statusText} - ${errorBody}`);
	}

	// For PUT/DELETE/POST requests, Spotify may return empty body
	// For GET requests, always parse JSON
	const contentLength = res.headers.get("content-length");
	if (contentLength === "0") {
		return {};
	}

	const text = await res.text();
	if (!text) {
		return {};
	}

	return JSON.parse(text);
}

export default app
	.get(
		"/saved",
		zValidator(
			"query",
			z.object({
				limit: z.coerce.number().int().min(1).max(50).default(15),
				offset: z.coerce.number().int().min(0).default(0),
			}),
		),
		async (c) => {
			const token = getOAuthToken(c);
			const { limit, offset } = c.req.valid("query");
			const albums = await spotifyFetch(`/me/albums?limit=${limit}&offset=${offset}`, token);
			return c.json(albums);
		},
	)
	.get("/:id", async (c) => {
		const provider = getMusicProvider(c);
		const token = getOAuthToken(c);
		const albumId = c.req.param("id");
		const refresh = c.req.query("refresh") === "true";

		// isSaved is user-specific — always fetched live from Spotify, never replicated.
		const savedPromise = spotifyFetch(
			`/me/library/contains?uris=spotify:album:${albumId}`,
			token,
		).then((status) => Array.isArray(status) && status[0] === true);

		// Serve from the replica when available; refresh it in the background.
		if (!refresh) {
			const cached = await getAlbumFromDb(albumId);
			if (cached) {
				provider
					.getAlbum(albumId)
					.then(upsertAlbum)
					.catch((err) => console.error("Album replica update failed:", err));

				return c.json({ ...cached, isSaved: await savedPromise });
			}
		}

		// Miss (or forced refresh): fetch live, replicate, return.
		const album = await provider.getAlbum(albumId);
		await upsertAlbum(album);

		return c.json({ ...album, isSaved: await savedPromise });
	})
	.get("/", async (c) => {
		const provider = getMusicProvider(c);
		const albums = await provider.getUserAlbums({ limit: 10, offset: 0 });
		return c.json(albums);
	})
	// Save album to library
	.put(
		"/",
		zValidator(
			"json",
			z.object({
				albumId: z.string(),
			}),
		),
		async (c) => {
			const token = getOAuthToken(c);
			const body = c.req.valid("json");

			await spotifyFetch(`/me/library?uris=spotify:album:${body.albumId}`, token, {
				method: "PUT",
			});

			return c.json({ ok: true });
		},
	)
	// Remove album from library
	.delete(
		"/",
		zValidator(
			"json",
			z.object({
				albumId: z.string(),
			}),
		),
		async (c) => {
			const token = getOAuthToken(c);
			const body = c.req.valid("json");

			await spotifyFetch(`/me/library?uris=spotify:album:${body.albumId}`, token, {
				method: "DELETE",
			});

			return c.json({ ok: true });
		},
	)
	// Check if albums are saved
	.post(
		"/contains",
		zValidator(
			"json",
			z.object({
				albumIds: z.array(z.string()),
			}),
		),
		async (c) => {
			const token = getOAuthToken(c);
			const body = c.req.valid("json");

			const uris = body.albumIds.map((id) => `spotify:album:${id}`).join(",");
			const result = await spotifyFetch(
				`/me/library/contains?uris=${encodeURIComponent(uris)}`,
				token,
			);

			return c.json(result);
		},
	);
