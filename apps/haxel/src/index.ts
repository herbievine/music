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
	const origins = c.env.CORS_ORIGINS ? c.env.CORS_ORIGINS.split(",") : "*";
	return cors({
		origin: origins,
	})(c, next);
});

const routes = app
	.get("/:spotifyId", async (c) => {
		const { spotifyId } = c.req.param();
		const db = drizzle(c.env.DB);
		const youtubeVideoIdParam = c.req.query("youtubeVideoId");
		const durationParam = c.req.query("duration");

		let [song] = await db
			.select()
			.from(songs)
			.where(eq(songs.externalId, spotifyId));

		// If youtubeVideoId param provided and song exists with cached audio, use the param
		if (youtubeVideoIdParam && song?.bucketId) {
			console.log("Using provided YouTube video ID:", youtubeVideoIdParam);
			const link = await converter(youtubeVideoIdParam, c.env.CONVERTER_API_KEY);
			const arrayBuffer = await getArrayBuffer(link, {
				headers: {
					"content-type": "audio/mpeg",
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 herbievine",
				},
			});

			const header = c.req.header("Authorization");
			if (!header) {
				throw new HTTPException(401, { message: "Not authorized" });
			}

			const parts = header.split(" ");
			const token = parts[1];
			if (!token || !parts[0]?.toLowerCase().includes("bearer")) {
				throw new HTTPException(401, { message: "Invalid authorization header" });
			}

			const { error, data: track } = await tryCatch(
				new SpotifyAPI({
					clientCredentials: {
						clientId: c.env.SPOTIFY_CLIENT_ID,
						clientSecret: c.env.SPOTIFY_CLIENT_SECRET,
					},
					accessToken: token,
				}).tracks.get(spotifyId),
			);

			if (!error && track) {
				const trackWithTags = await write(track, arrayBuffer);
				const { key } = await c.env.AUDIO.put(id(), trackWithTags, {
					httpMetadata: { contentType: "audio/mpeg" },
				});

				return c.json({
					url: `https://audio.herbievine.com/${key}`,
					data: { ...song, bucketId: key },
				});
			}
		}

		if (!song) {
			const header = c.req.header("Authorization");

			if (!header) {
				throw new HTTPException(401, { message: "Not authorized" });
			}

			const parts = header.split(" ");
			const token = parts[1];

			if (!token || !parts[0]?.toLowerCase().includes("bearer")) {
				throw new HTTPException(401, { message: "Invalid authorization header" });
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

			let videoId = youtubeVideoIdParam;

			// If no videoId param provided, search YouTube
			if (!videoId) {
				const {
					items: [video],
				} = await youtube(
					`${track.artists[0].name} ${track.name} audio`,
					c.env.YOUTUBE_API_KEY,
					durationParam ? parseInt(durationParam) : undefined,
				);
				videoId = video.id.videoId;
			}

			console.log("Youtube video ID:", videoId);

			const link = await converter(videoId, c.env.CONVERTER_API_KEY);

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
