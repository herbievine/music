import { drizzle, eq, or, songs } from "@music/db";
import { SpotifyAPI } from "@statsfm/spotify.js";
import { configDotenv } from "dotenv";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { converter } from "./api/converter.js";
import { youtube } from "./api/youtube.js";
import { write } from "./lib/id3.js";
import { getArrayBuffer } from "./utils/get-array-buffer";
import { id } from "./utils/id.js";
import { tryCatch } from "./utils/try-catch.js";

configDotenv();

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use(contextStorage());
app.use(async (c, next) => {
	return cors({
		origin: c.env.CORS_ORIGINS.split(","),
	})(c, next);
});

const routes = app
	.get("/:spotifyId", async (c) => {
		const { spotifyId } = c.req.param();
		const db = drizzle(c.env.DB);

		let [song] = await db
			.select()
			.from(songs)
			.where(eq(songs.externalId, spotifyId));

		if (!song) {
			const header = c.req.header("Authorization");

			if (!header) {
				throw new HTTPException(401, { message: "Not authorized" });
			}

			const token = header.split(" ")[1];

			if (!token) {
				throw new HTTPException(401, { message: "No token" });
			}

			const client = new SpotifyAPI({
				clientCredentials: {
					clientId: c.env.SPOTIFY_CLIENT_ID,
					clientSecret: c.env.SPOTIFY_CLIENT_SECRET,
				},
				accessToken: token,
			});

			const { error, data: track } = await tryCatch(
				client.tracks.get(spotifyId),
			);

			if (error) {
				throw new HTTPException(404, {
					message: "Track not found",
					cause: error.message + error.cause,
				});
			}

			console.log("Processing new song:", track.id);

			const {
				items: [video],
			} = await youtube(
				`${track.artists[0].name} ${track.name} audio`,
				c.env.YOUTUBE_API_KEY,
			);

			console.log("Youtube video ID:", video.id.videoId);

			const link = await converter(video.id.videoId, c.env.CONVERTER_API_KEY);

			console.log("Converter link:", link);

			const arrayBuffer = await getArrayBuffer(link, {
				headers: {
					"content-type": "audio/mpeg",
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 herbievine",
				},
			});

			const trackWithTags = await write(track, arrayBuffer);

			const { key } = await c.env.AUDIO.put(id(), trackWithTags, {
				httpMetadata: { contentType: "audio/mpeg" },
			});

			[song] = await db
				.insert(songs)
				.values({
					id: id(),
					bucketId: key,
					externalId: spotifyId,
				})
				.returning();
		}

		return c.json({
			url: `https://audio.herbievine.com/${song.bucketId}`,
			data: song,
		});
	})
	.delete("/:id", async (c) => {
		const db = drizzle(c.env.DB);

		const [song] = await db
			.delete(songs)
			.where(
				or(
					eq(songs.id, c.req.param("id")),
					eq(songs.externalId, c.req.param("id")),
				),
			)
			.returning();

		return c.json({
			ok: true,
			song,
		});
	})
	// .delete("/", async (c) => {
	// 	const db = drizzle(c.env.DB);

	// 	await db.delete(songs);

	// 	return c.json({
	// 		ok: true,
	// 	});
	// })
	.get("/all", async (c) => {
		const db = drizzle(c.env.DB);

		const results = await db.select().from(songs);

		return c.json({
			ok: true,
			count: results.length,
			results,
		});
	});

export type AppType = typeof routes;

export default app;
