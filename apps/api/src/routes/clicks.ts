import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { playClicks } from "../db/schema.js";
import { getUserId } from "../lib/middleware.js";

const app = new Hono();

const metadataSchema = z.object({
	name: z.string(),
	images: z.array(
		z.object({ url: z.string(), width: z.number().optional(), height: z.number().optional() }),
	),
	artists: z
		.array(z.object({ id: z.string(), name: z.string() }))
		.optional(),
	description: z.string().optional(),
	releaseDate: z.string().optional(),
	durationMs: z.number().optional(),
	album: z
		.object({
			id: z.string(),
			name: z.string(),
			images: z.array(
				z.object({ url: z.string(), width: z.number().optional(), height: z.number().optional() }),
			),
			releaseDate: z.string(),
		})
		.optional(),
});

export default app.post(
	"/",
	zValidator(
		"json",
		z.object({
			contextType: z.enum(["album", "playlist", "track"]),
			contextId: z.string(),
			metadata: metadataSchema,
		}),
	),
	async (c) => {
		const userId = getUserId(c);
		const body = c.req.valid("json");

		await db.insert(playClicks).values({
			userId,
			contextType: body.contextType,
			contextId: body.contextId,
			metadata: body.metadata,
		});

		return c.json({ ok: true }, 201);
	},
);
