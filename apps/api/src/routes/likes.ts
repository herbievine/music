import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { likes, userPlaylistTracks, userPlaylists } from "../db/schema.js";
import { getUserId } from "../lib/middleware.js";
import { getOrCreateFavoritesPlaylist } from "./user-playlists.js";

const app = new Hono();

export default app
	.get(
		"/",
		zValidator(
			"query",
			z.object({
				type: z.enum(["track", "album", "playlist"]).optional(),
			}),
		),
		async (c) => {
			const userId = getUserId(c);
			const { type } = c.req.valid("query");

			const conditions = [eq(likes.userId, userId)];
			if (type) {
				conditions.push(eq(likes.itemType, type));
			}

			const items = await db
				.select()
				.from(likes)
				.where(and(...conditions))
				.orderBy(desc(likes.createdAt));

			return c.json({ items });
		},
	)
	.post(
		"/",
		zValidator(
			"json",
			z.object({
				itemId: z.string(),
				itemType: z.enum(["track", "album", "playlist"]),
				metadata: z.object({
					name: z.string(),
					image: z.string(),
					artist: z.string(),
				}),
			}),
		),
		async (c) => {
			const userId = getUserId(c);
			const body = c.req.valid("json");

			const existing = await db
				.select()
				.from(likes)
				.where(
					and(
						eq(likes.userId, userId),
						eq(likes.itemId, body.itemId),
						eq(likes.itemType, body.itemType),
					),
				);

			if (existing.length > 0) {
				return c.json(existing[0]);
			}

			const [like] = await db
				.insert(likes)
				.values({
					userId,
					itemId: body.itemId,
					itemType: body.itemType,
					metadata: body.metadata,
				})
				.returning();

			// If track, add to Favorites playlist
			if (body.itemType === "track") {
				const favorites = await getOrCreateFavoritesPlaylist(userId);

				// Check if track already in favorites (shouldn't happen but be safe)
				const existing = await db
					.select()
					.from(userPlaylistTracks)
					.where(
						and(
							eq(userPlaylistTracks.playlistId, favorites.id),
							eq(userPlaylistTracks.trackId, body.itemId),
						),
					);

				if (existing.length === 0) {
					// Get next position
					const last = await db
						.select({ position: userPlaylistTracks.position })
						.from(userPlaylistTracks)
						.where(eq(userPlaylistTracks.playlistId, favorites.id))
						.orderBy(desc(userPlaylistTracks.position))
						.limit(1);

					const position = last.length > 0 ? last[0].position + 1 : 0;

					await db.insert(userPlaylistTracks).values({
						playlistId: favorites.id,
						trackId: body.itemId,
						trackMetadata: {
							name: body.metadata.name,
							artists: [body.metadata.artist],
							albumName: "",
							albumImage: body.metadata.image,
							durationMs: 0,
						},
						position,
					});
				}
			}

			return c.json(like, 201);
		},
	)
	.delete("/:id", async (c) => {
		const userId = getUserId(c);
		const id = c.req.param("id");

		const [deleted] = await db
			.delete(likes)
			.where(and(eq(likes.id, id), eq(likes.userId, userId)))
			.returning();

		if (!deleted) {
			return c.json({ message: "Not found" }, 404);
		}

		// If track, remove from Favorites playlist
		if (deleted.itemType === "track") {
			const favorites = await getOrCreateFavoritesPlaylist(userId);

			await db
				.delete(userPlaylistTracks)
				.where(
					and(
						eq(userPlaylistTracks.playlistId, favorites.id),
						eq(userPlaylistTracks.trackId, deleted.itemId),
					),
				);
		}

		return c.json({ ok: true });
	});
