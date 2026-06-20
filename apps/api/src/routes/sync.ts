import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { likes, userPlaylistTracks, userPlaylists } from "../db/schema.js";
import { getMusicProvider, getUserId } from "../lib/middleware.js";
import type { MusicProvider } from "../lib/music-provider.js";
import { getOrCreateFavoritesPlaylist } from "./user-playlists.js";

const app = new Hono();

// Walk Spotify's saved-tracks pagination until the full library is collected.
async function fetchAllSavedTracks(provider: MusicProvider) {
	const out: Awaited<ReturnType<MusicProvider["getUserSavedTracks"]>>["items"] = [];
	const limit = 50;
	let offset = 0;
	for (;;) {
		const page = await provider.getUserSavedTracks({ limit, offset });
		out.push(...page.items);
		offset += limit;
		if (out.length >= page.total || page.items.length === 0) break;
	}
	return out;
}

// Walk Spotify's saved-albums pagination (no total is returned, so stop on a short page).
async function fetchAllSavedAlbums(provider: MusicProvider) {
	const out: Awaited<ReturnType<MusicProvider["getUserAlbums"]>>["items"] = [];
	const limit = 50;
	let offset = 0;
	for (;;) {
		const page = await provider.getUserAlbums({ limit, offset });
		out.push(...page.items);
		offset += limit;
		if (page.items.length < limit) break;
	}
	return out;
}

export default app
	// Spotify library annotated with what's already been imported into Supabase.
	.get("/status", async (c) => {
		const userId = getUserId(c);
		const provider = getMusicProvider(c);

		const [savedTracks, savedAlbums, playlistsRes, existingLikes, importedPlaylists] =
			await Promise.all([
				fetchAllSavedTracks(provider),
				fetchAllSavedAlbums(provider),
				provider.getUserPlaylists(),
				db
					.select({ itemId: likes.itemId, itemType: likes.itemType })
					.from(likes)
					.where(eq(likes.userId, userId)),
				db
					.select({ spotifyId: userPlaylists.spotifyId })
					.from(userPlaylists)
					.where(eq(userPlaylists.userId, userId)),
			]);

		const likedTrackIds = new Set(
			existingLikes.filter((l) => l.itemType === "track").map((l) => l.itemId),
		);
		const likedAlbumIds = new Set(
			existingLikes.filter((l) => l.itemType === "album").map((l) => l.itemId),
		);
		const importedPlaylistIds = new Set(
			importedPlaylists.map((p) => p.spotifyId).filter(Boolean) as string[],
		);

		return c.json({
			tracks: savedTracks.map(({ track }) => ({
				id: track.id,
				name: track.name,
				artists: track.artists.map((a) => a.name),
				albumName: track.album.name,
				albumImage: track.album.images[0]?.url ?? "",
				durationMs: track.durationMs,
				imported: likedTrackIds.has(track.id),
			})),
			albums: savedAlbums.map(({ album }) => ({
				id: album.id,
				name: album.name,
				image: album.images[0]?.url ?? "",
				artist: album.artists.map((a) => a.name).join(", "),
				imported: likedAlbumIds.has(album.id),
			})),
			playlists: playlistsRes.items.map((pl) => ({
				id: pl.id,
				name: pl.name,
				description: pl.description,
				image: pl.images[0]?.url ?? "",
				imported: importedPlaylistIds.has(pl.id),
			})),
		});
	})

	// Import the user-selected subset of their Spotify library into Supabase.
	// Tracks/albums carry client metadata (matching the likes/user-playlists POST
	// convention); playlists are fetched server-side by id for their full track list.
	.post(
		"/import",
		zValidator(
			"json",
			z.object({
				tracks: z
					.array(
						z.object({
							id: z.string(),
							name: z.string(),
							artists: z.array(z.string()),
							albumName: z.string(),
							albumImage: z.string(),
							durationMs: z.number(),
						}),
					)
					.default([]),
				albums: z
					.array(
						z.object({
							id: z.string(),
							name: z.string(),
							image: z.string(),
							artist: z.string(),
						}),
					)
					.default([]),
				playlistIds: z.array(z.string()).default([]),
			}),
		),
		async (c) => {
			const userId = getUserId(c);
			const provider = getMusicProvider(c);
			const body = c.req.valid("json");

			let tracksImported = 0;
			let albumsImported = 0;
			let playlistsImported = 0;

			// ── Liked songs → track-likes + Favorites playlist ──────────────────
			if (body.tracks.length > 0) {
				const favorites = await getOrCreateFavoritesPlaylist(userId);

				const trackIds = body.tracks.map((t) => t.id);
				const [alreadyLiked, alreadyInFavorites, lastPos] = await Promise.all([
					db
						.select({ itemId: likes.itemId })
						.from(likes)
						.where(
							and(
								eq(likes.userId, userId),
								eq(likes.itemType, "track"),
								inArray(likes.itemId, trackIds),
							),
						),
					db
						.select({ trackId: userPlaylistTracks.trackId })
						.from(userPlaylistTracks)
						.where(
							and(
								eq(userPlaylistTracks.playlistId, favorites.id),
								inArray(userPlaylistTracks.trackId, trackIds),
							),
						),
					db
						.select({ position: userPlaylistTracks.position })
						.from(userPlaylistTracks)
						.where(eq(userPlaylistTracks.playlistId, favorites.id))
						.orderBy(desc(userPlaylistTracks.position))
						.limit(1),
				]);

				const likedSet = new Set(alreadyLiked.map((l) => l.itemId));
				const favSet = new Set(alreadyInFavorites.map((t) => t.trackId));
				let position = lastPos.length > 0 ? lastPos[0].position + 1 : 0;

				const likeRows: (typeof likes.$inferInsert)[] = [];
				const favRows: (typeof userPlaylistTracks.$inferInsert)[] = [];
				for (const t of body.tracks) {
					if (!likedSet.has(t.id)) {
						likeRows.push({
							userId,
							itemId: t.id,
							itemType: "track",
							metadata: {
								name: t.name,
								image: t.albumImage,
								artist: t.artists.join(", "),
							},
						});
						tracksImported++;
					}
					if (!favSet.has(t.id)) {
						favRows.push({
							playlistId: favorites.id,
							trackId: t.id,
							trackMetadata: {
								name: t.name,
								artists: t.artists,
								albumName: t.albumName,
								albumImage: t.albumImage,
								durationMs: t.durationMs,
							},
							position: position++,
						});
					}
				}

				await db.transaction(async (tx) => {
					if (likeRows.length > 0) await tx.insert(likes).values(likeRows);
					if (favRows.length > 0)
						await tx.insert(userPlaylistTracks).values(favRows);
				});
			}

			// ── Saved albums → album-likes ──────────────────────────────────────
			if (body.albums.length > 0) {
				const albumIds = body.albums.map((a) => a.id);
				const existing = await db
					.select({ itemId: likes.itemId })
					.from(likes)
					.where(
						and(
							eq(likes.userId, userId),
							eq(likes.itemType, "album"),
							inArray(likes.itemId, albumIds),
						),
					);
				const existingSet = new Set(existing.map((l) => l.itemId));

				const rows = body.albums
					.filter((a) => !existingSet.has(a.id))
					.map((a) => ({
						userId,
						itemId: a.id,
						itemType: "album",
						metadata: { name: a.name, image: a.image, artist: a.artist },
					}));

				if (rows.length > 0) {
					await db.insert(likes).values(rows);
					albumsImported = rows.length;
				}
			}

			// ── Playlists → user_playlists (+ tracks), skipping already-imported ─
			if (body.playlistIds.length > 0) {
				const existing = await db
					.select({ spotifyId: userPlaylists.spotifyId })
					.from(userPlaylists)
					.where(
						and(
							eq(userPlaylists.userId, userId),
							inArray(userPlaylists.spotifyId, body.playlistIds),
						),
					);
				const existingSet = new Set(
					existing.map((p) => p.spotifyId).filter(Boolean) as string[],
				);

				const toImport = body.playlistIds.filter((id) => !existingSet.has(id));

				for (const spotifyId of toImport) {
					const playlist = await provider.getPlaylist(spotifyId);

					await db.transaction(async (tx) => {
						const [created] = await tx
							.insert(userPlaylists)
							.values({
								userId,
								name: playlist.name,
								description: playlist.description || null,
								spotifyId,
							})
							.returning();

						const trackRows = playlist.tracks.items.map(({ track }, i) => ({
							playlistId: created.id,
							trackId: track.id,
							trackMetadata: {
								name: track.name,
								artists: track.artists.map((a) => a.name),
								albumName: track.album.name,
								albumImage: track.album.images[0]?.url ?? "",
								durationMs: track.durationMs,
							},
							position: i,
						}));

						if (trackRows.length > 0)
							await tx.insert(userPlaylistTracks).values(trackRows);
					});

					playlistsImported++;
				}
			}

			return c.json({
				tracksImported,
				albumsImported,
				playlistsImported,
			});
		},
	);
