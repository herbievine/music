import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { likes } from "../db/schema.js";
import { getUserId } from "../lib/middleware.js";

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

		return c.json({ ok: true });
	});
