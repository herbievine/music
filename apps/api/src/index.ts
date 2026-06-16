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
import clicksRoutes from "./routes/clicks.js";
import { buildHome } from "./routes/home.js";
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
	.route("/clicks", clicksRoutes)
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
	.get("/home", async (c) => {
		const userId = getUserId(c);
		const provider = getMusicProvider(c);
		const oauthToken = getOAuthToken(c);
		return c.json(await buildHome(userId, provider, oauthToken));
	});

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
