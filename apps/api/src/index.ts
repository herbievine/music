import { clerkMiddleware } from "@hono/clerk-auth";
import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { config } from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { getMusicProvider, getOAuthToken, getUserId, providerMiddleware } from "./lib/middleware.js";
import albumRoutes from "./routes/albums.js";
import artistRoutes from "./routes/artists.js";
import {
	getFrequentlyPlayed,
	getJumpBackIn,
	getRecentAlbums,
	getRecentArtists,
	getRecentTracks,
} from "./routes/home.js";
import likesRoutes from "./routes/likes.js";
import lyricsRoutes from "./routes/lyrics.js";
import playerRoutes from "./routes/player.js";
import playlistRoutes from "./routes/playlists.js";

config();

if (!process.env.CORS_ORIGIN) {
	throw new Error("CORS_ORIGIN not set");
}

const app = new Hono();

app.use(
	cors({
		origin: process.env.CORS_ORIGIN,
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use("*", clerkMiddleware());
app.use("*", providerMiddleware);

const routes = app
	.route("/", playerRoutes)
	.route("/albums", albumRoutes)
	.route("/artists", artistRoutes)
	.route("/playlists", playlistRoutes)
	.route("/likes", likesRoutes)
	.route("/lyrics", lyricsRoutes)
	.get(
		"/search",
		zValidator(
			"query",
			z.object({
				q: z.string(),
				type: z.enum(["album", "track", "artist", "playlist"]),
			}),
		),
		async (c) => {
			const provider = getMusicProvider(c);
			const query = c.req.valid("query");
			const result = await provider.search(query.q, query.type);
			return c.json(result);
		},
	)
	.get(
		"/recents",
		zValidator(
			"query",
			z.object({
				limit: z.coerce.number().default(8),
				type: z.enum(["track", "album", "artist"]).optional(),
			}),
		),
		async (c) => {
			const userId = getUserId(c);
			const { limit, type } = c.req.valid("query");
			const result =
				type === "album"
					? await getRecentAlbums(userId, limit)
					: type === "artist"
						? await getRecentArtists(userId, limit, getOAuthToken(c))
						: await getRecentTracks(userId, limit);
			return c.json(result as { items: unknown[]; total: number });
		},
	)
	.get("/jump-back-in", async (c) => {
		const userId = getUserId(c);
		return c.json(await getJumpBackIn(userId));
	})
	.get(
		"/frequently-played",
		zValidator("query", z.object({ limit: z.coerce.number().default(8) })),
		async (c) => {
			const userId = getUserId(c);
			const { limit } = c.req.valid("query");
			return c.json(await getFrequentlyPlayed(userId, limit));
		},
	);

export type AppType = typeof routes;

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
