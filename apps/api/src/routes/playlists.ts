import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getOAuthToken } from "../lib/middleware.js";
import { fetchInternalPlaylist, PlaylistNotFoundError } from "../lib/spotify-internal.js";
import type { MusicPlaylist } from "../types.js";

const app = new Hono();

const SPOTIFY_API = "https://api.spotify.com/v1";

// Map a pathfinder MusicPlaylist's tracks into the { item } shape the frontend
// expects. The frontend's SpotifyTrack type uses Spotify's snake_case shape
// (duration_ms), so convert from the pathfinder's camelCase MusicTrack here —
// otherwise durations render as 0 and playback gets an undefined durationMs.
// Pathfinder tracks carry no added_at/by.
function pathfinderItems(internal: MusicPlaylist) {
	return {
		total: internal.tracks.total,
		items: internal.tracks.items.map(({ track }) => ({
			added_at: null,
			added_by: null,
			is_local: false,
			item: {
				id: track.id,
				name: track.name,
				duration_ms: track.durationMs,
				artists: track.artists.map((a) => ({ id: a.id, name: a.name })),
				album: {
					id: track.album.id,
					name: track.album.name,
					images: track.album.images,
				},
			},
		})),
	};
}

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

		let playlist: Record<string, any>;
		try {
			playlist = await spotifyFetch(`/playlists/${id}`, token);
		} catch (err) {
			// At this app's access level the official API won't serve playlist
			// detail: user playlists return 403 and Spotify-owned editorial ones
			// 404. Fall back to the internal pathfinder API for both — it resolves
			// every playlist type and embeds the tracks. Other failures (401 auth,
			// 429 rate limit) should still propagate.
			if (
				!(err instanceof Error) ||
				(!err.message.includes("403") && !err.message.includes("404"))
			) {
				throw err;
			}

			try {
				// First 100 tracks only — covers the editorial/algorithmic target
				// (Daily Mix 50, editorial ~60). Large user playlists truncate here.
				const internal = await fetchInternalPlaylist(id, { limit: 100 });
				return c.json({
					...internal,
					items: pathfinderItems(internal),
					isFollowing: false,
				});
			} catch (internalErr) {
				if (internalErr instanceof PlaylistNotFoundError) {
					return c.json({ message: "Playlist not found" }, 404);
				}
				throw internalErr;
			}
		}

		// The official API gives no tracks at this app's access level: /playlists/{id}
		// omits the tracks payload and /playlists/{id}/tracks returns 403. Load them
		// via the internal pathfinder, degrading to an empty list (still 200) rather
		// than failing the page if it can't resolve. (First 100 tracks only.)
		let items: ReturnType<typeof pathfinderItems> = { total: 0, items: [] };
		try {
			const internal = await fetchInternalPlaylist(id, { limit: 100 });
			items = pathfinderItems(internal);
		} catch (err) {
			console.error(`Playlist tracks fetch failed for ${id}:`, err);
		}

		// Check if user follows the playlist (optional - don't fail if this errors)
		let isFollowing = false;
		try {
			const followStatus = await spotifyFetch(
				`/playlists/${id}/followers/contains?ids=me`,
				token,
			);
			isFollowing = Array.isArray(followStatus) && followStatus[0] === true;
		} catch (err) {
			// Following status check failed, just return false
			isFollowing = false;
		}

		return c.json({
			...playlist,
			items,
			isFollowing,
		});
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
