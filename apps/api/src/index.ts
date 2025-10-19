import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { config } from "dotenv";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { spotifyClient } from "./lib/spotify.js";
import albumRoutes from "./routes/albums.js";
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
		allowHeaders: [],
		allowMethods: ["GET"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use("*", clerkMiddleware());
app.use("*", async (c, next) => {
	const auth = getAuth(c);

	if (!auth?.userId) {
		return c.json(
			{
				message: "You are not logged in.",
			},
			400,
		);
	}

	return next();
});

const routes = app
	.route("/", playerRoutes)
	.route("/albums", albumRoutes)
	.route("/playlists", playlistRoutes)
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
			const auth = getAuth(c);
			const client = c.get("clerk");

			if (!auth?.userId) {
				return c.text("Error", 500);
			}

			const oauthTokens = await client.users.getUserOauthAccessToken(
				auth?.userId,
				"spotify",
			);

			if (oauthTokens.totalCount === 0) {
				return c.json({ error: true }, 500);
			}

			const { token } = oauthTokens.data[0];

			const query = c.req.valid("query");

			const results = await spotifyClient(token).search.get(query.q, {
				include: {
					track: query.type === "track",
					album: query.type === "album",
					artist: query.type === "artist",
					playlist: query.type === "playlist",
				},
			});

			const data = Object.assign(
				results.tracks ?? {},
				results.albums ?? {},
				results.artists ?? {},
				results.playlists ?? {},
			);

			const { items, ...meta } = data;

			return c.json({
				results: items.filter((i) => !!i),
				meta,
			});
		},
	)
	.get("/new-releases", async (c) => {
		const auth = getAuth(c);
		const client = c.get("clerk");

		if (!auth?.userId) {
			return c.text("Error", 500);
		}

		const oauthTokens = await client.users.getUserOauthAccessToken(
			auth?.userId,
			"spotify",
		);

		if (oauthTokens.totalCount === 0) {
			return c.json({ error: true }, 500);
		}

		const { token } = oauthTokens.data[0];

		const results = await spotifyClient(token).albums.newReleases({
			limit: 10,
		});

		return c.json(results);
	})
	.get(
		"/recents",
		zValidator(
			"query",
			z.object({
				range: z
					.enum(["short_term", "medium_term", "long_term"])
					.default("medium_term"),
				limit: z.number().default(20),
			}),
		),
		async (c) => {
			const auth = getAuth(c);
			const client = c.get("clerk");

			if (!auth?.userId) {
				return c.text("Error", 500);
			}

			const oauthTokens = await client.users.getUserOauthAccessToken(
				auth?.userId,
				"spotify",
			);

			if (oauthTokens.totalCount === 0) {
				return c.json({ error: true }, 500);
			}

			const { token } = oauthTokens.data[0];

			const recents = await spotifyClient(token).me.top("tracks", {
				timeRange: c.req.valid("query").range,
				limit: c.req.valid("query").limit, // add one more for top pick
				offset: 0,
			});

			return c.json(recents);
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
