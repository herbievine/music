import { Hono } from "hono";
import { getMusicProvider } from "../lib/middleware.js";

const app = new Hono();

export default app
	.get("/:id", async (c) => {
		const provider = getMusicProvider(c);
		const playlist = await provider.getPlaylist(c.req.param("id"));
		return c.json(playlist);
	})
	.get("/", async (c) => {
		const provider = getMusicProvider(c);
		const playlists = await provider.getUserPlaylists();
		return c.json(playlists);
	});
