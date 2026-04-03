import { Hono } from "hono";
import { getMusicProvider } from "../lib/middleware.js";

const app = new Hono();

app.get("/:id", async (c) => {
	const provider = getMusicProvider(c);
	const { id } = c.req.param();
	const result = await provider.getArtist(id);
	return c.json(result);
});

export default app;
