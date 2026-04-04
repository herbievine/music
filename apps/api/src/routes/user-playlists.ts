import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { userPlaylistTracks, userPlaylists } from "../db/schema.js";
import { getUserId } from "../lib/middleware.js";

const app = new Hono();

export default app
	// List all playlists
	.get("/", async (c) => {
		const userId = getUserId(c);
		const playlists = await db
			.select()
			.from(userPlaylists)
			.where(eq(userPlaylists.userId, userId))
			.orderBy(desc(userPlaylists.createdAt));
		return c.json({ playlists });
	})

	// Create playlist
	.post(
		"/",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).max(100),
				description: z.string().max(500).optional(),
			}),
		),
		async (c) => {
			const userId = getUserId(c);
			const body = c.req.valid("json");
			const [playlist] = await db
				.insert(userPlaylists)
				.values({ userId, name: body.name, description: body.description })
				.returning();
			return c.json(playlist, 201);
		},
	)

	// Get single playlist with tracks
	.get("/:id", async (c) => {
		const userId = getUserId(c);
		const id = c.req.param("id");

		const [playlist] = await db
			.select()
			.from(userPlaylists)
			.where(and(eq(userPlaylists.id, id), eq(userPlaylists.userId, userId)));

		if (!playlist) return c.json({ message: "Not found" }, 404);

		const tracks = await db
			.select()
			.from(userPlaylistTracks)
			.where(eq(userPlaylistTracks.playlistId, id))
			.orderBy(asc(userPlaylistTracks.position));

		return c.json({ ...playlist, tracks });
	})

	// Update playlist name/description
	.patch(
		"/:id",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1).max(100).optional(),
				description: z.string().max(500).optional(),
			}),
		),
		async (c) => {
			const userId = getUserId(c);
			const id = c.req.param("id");
			const body = c.req.valid("json");

			const [updated] = await db
				.update(userPlaylists)
				.set({ ...body, updatedAt: new Date() })
				.where(and(eq(userPlaylists.id, id), eq(userPlaylists.userId, userId)))
				.returning();

			if (!updated) return c.json({ message: "Not found" }, 404);
			return c.json(updated);
		},
	)

	// Delete playlist
	.delete("/:id", async (c) => {
		const userId = getUserId(c);
		const id = c.req.param("id");

		const [deleted] = await db
			.delete(userPlaylists)
			.where(and(eq(userPlaylists.id, id), eq(userPlaylists.userId, userId)))
			.returning();

		if (!deleted) return c.json({ message: "Not found" }, 404);
		return c.json({ ok: true });
	})

	// Add track to playlist
	.post(
		"/:id/tracks",
		zValidator(
			"json",
			z.object({
				trackId: z.string(),
				trackMetadata: z.object({
					name: z.string(),
					artists: z.array(z.string()),
					albumName: z.string(),
					albumImage: z.string(),
					durationMs: z.number(),
				}),
			}),
		),
		async (c) => {
			const userId = getUserId(c);
			const playlistId = c.req.param("id");
			const body = c.req.valid("json");

			// Verify ownership
			const [playlist] = await db
				.select({ id: userPlaylists.id })
				.from(userPlaylists)
				.where(
					and(
						eq(userPlaylists.id, playlistId),
						eq(userPlaylists.userId, userId),
					),
				);

			if (!playlist) return c.json({ message: "Not found" }, 404);

			// Next position
			const last = await db
				.select({ position: userPlaylistTracks.position })
				.from(userPlaylistTracks)
				.where(eq(userPlaylistTracks.playlistId, playlistId))
				.orderBy(desc(userPlaylistTracks.position))
				.limit(1);

			const position = last.length > 0 ? last[0].position + 1 : 0;

			const [track] = await db
				.insert(userPlaylistTracks)
				.values({
					playlistId,
					trackId: body.trackId,
					trackMetadata: body.trackMetadata,
					position,
				})
				.returning();

			return c.json(track, 201);
		},
	)

	// Remove track entry from playlist (by entry id, not track id, to support duplicates)
	.delete("/:id/tracks/:entryId", async (c) => {
		const userId = getUserId(c);
		const playlistId = c.req.param("id");
		const entryId = c.req.param("entryId");

		const [playlist] = await db
			.select({ id: userPlaylists.id })
			.from(userPlaylists)
			.where(
				and(
					eq(userPlaylists.id, playlistId),
					eq(userPlaylists.userId, userId),
				),
			);

		if (!playlist) return c.json({ message: "Not found" }, 404);

		const [deleted] = await db
			.delete(userPlaylistTracks)
			.where(
				and(
					eq(userPlaylistTracks.id, entryId),
					eq(userPlaylistTracks.playlistId, playlistId),
				),
			)
			.returning();

		if (!deleted) return c.json({ message: "Not found" }, 404);
		return c.json({ ok: true });
	});
