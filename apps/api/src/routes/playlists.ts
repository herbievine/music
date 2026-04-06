import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getOAuthToken } from "../lib/middleware.js";

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
	// Get user's playlists
	.get("/", async (c) => {
		const token = getOAuthToken(c);
		const data = await spotifyFetch("/me/playlists", token);
		return c.json({ playlists: data.items });
	})

	// Create playlist
	.post(
		"/",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).max(100),
				description: z.string().max(300).optional(),
				isPublic: z.boolean().default(false),
			}),
		),
		async (c) => {
			const token = getOAuthToken(c);
			const body = c.req.valid("json");

			const playlist = await spotifyFetch("/me/playlists", token, {
				method: "POST",
				body: JSON.stringify({
					name: body.name,
					description: body.description,
					public: body.isPublic,
				}),
			});

			return c.json(playlist, 201);
		},
	)

	// Get playlist details
	.get("/:id", async (c) => {
		const token = getOAuthToken(c);
		const id = c.req.param("id");
		const playlist = await spotifyFetch(`/playlists/${id}`, token);

		// Check if user follows the playlist
		const followStatus = await spotifyFetch(
			`/playlists/${id}/followers/contains?user_id=me`,
			token,
		);
		const isFollowing = Array.isArray(followStatus) && followStatus[0] === true;

		return c.json({ ...playlist, isFollowing });
	})

	// Update playlist
	.patch(
		"/:id",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).max(100).optional(),
				description: z.string().max(300).optional(),
				isPublic: z.boolean().optional(),
			}),
		),
		async (c) => {
			const token = getOAuthToken(c);
			const id = c.req.param("id");
			const body = c.req.valid("json");

			const updateBody: Record<string, any> = {};
			if (body.name) updateBody.name = body.name;
			if (body.description !== undefined) updateBody.description = body.description;
			if (body.isPublic !== undefined) updateBody.public = body.isPublic;

			await spotifyFetch(`/playlists/${id}`, token, {
				method: "PUT",
				body: JSON.stringify(updateBody),
			});

			const updated = await spotifyFetch(`/playlists/${id}`, token);
			return c.json(updated);
		},
	)

	// Delete playlist (unfollow)
	.delete("/:id", async (c) => {
		const token = getOAuthToken(c);
		const id = c.req.param("id");

		await spotifyFetch(`/playlists/${id}/followers`, token, {
			method: "DELETE",
		});

		return c.json({ ok: true });
	})

	// Add track to playlist
	.post(
		"/:id/tracks",
		zValidator(
			"json",
			z.object({
				trackId: z.string(),
				position: z.number().optional(),
			}),
		),
		async (c) => {
			const token = getOAuthToken(c);
			const id = c.req.param("id");
			const body = c.req.valid("json");

			await spotifyFetch(`/playlists/${id}/items`, token, {
				method: "POST",
				body: JSON.stringify({
					uris: [`spotify:track:${body.trackId}`],
					position: body.position,
				}),
			});

			return c.json({ ok: true }, 201);
		},
	)

	// Remove track from playlist
	.delete("/:id/tracks/:trackId", async (c) => {
		const token = getOAuthToken(c);
		const id = c.req.param("id");
		const trackId = c.req.param("trackId");

		await spotifyFetch(`/playlists/${id}/items`, token, {
			method: "DELETE",
			body: JSON.stringify({
				tracks: [{ uri: `spotify:track:${trackId}` }],
			}),
		});

		return c.json({ ok: true });
	});
