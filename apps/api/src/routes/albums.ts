import { Hono } from "hono";
import { getMusicProvider } from "../lib/middleware.js";

const app = new Hono();

export default app
	.get("/:id", async (c) => {
		const provider = getMusicProvider(c);
		const album = await provider.getAlbum(c.req.param("id"));
		return c.json(album);
	})
	.get("/", async (c) => {
		const provider = getMusicProvider(c);
		const albums = await provider.getUserAlbums({ limit: 10, offset: 0 });
		return c.json(albums);
	});
