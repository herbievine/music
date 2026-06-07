import { Hono } from "hono";
import { getArtistFromDb, upsertArtist } from "../lib/ingest.js";
import { getMusicProvider } from "../lib/middleware.js";

const app = new Hono();

app.get("/:id", async (c) => {
	const provider = getMusicProvider(c);
	const { id } = c.req.param();
	const refresh = c.req.query("refresh") === "true";

	// Serve from the replica when available; refresh it in the background.
	if (!refresh) {
		const cached = await getArtistFromDb(id);
		if (cached) {
			provider
				.getArtist(id)
				.then(upsertArtist)
				.catch((err) => console.error("Artist replica update failed:", err));

			return c.json(cached);
		}
	}

	// Miss (or forced refresh): fetch live, replicate, return.
	const result = await provider.getArtist(id);
	await upsertArtist(result);

	return c.json(result);
});

export default app;
