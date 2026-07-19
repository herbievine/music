import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { artists } from "../db/schema.js";
import { getArtistFromDb, upsertArtist } from "../lib/ingest.js";
import { getMusicProvider } from "../lib/middleware.js";
import { fetchArtistThisIsPlaylist } from "../lib/spotify-internal.js";

const app = new Hono();

app.get("/:id/this-is-playlist", async (c) => {
	const { id } = c.req.param();

	const [cached] = await db
		.select({ value: artists.thisIsPlaylist, checkedAt: artists.thisIsPlaylistCheckedAt })
		.from(artists)
		.where(eq(artists.id, id));
	if (cached?.checkedAt) return c.json(cached.value);

	const result = await fetchArtistThisIsPlaylist(id);
	// Best-effort: no-ops if the artist row doesn't exist yet (only possible on an
	// artist's very first-ever visit, before the main /:id route's upsertArtist
	// creates the row) — self-heals on the next visit.
	await db
		.update(artists)
		.set({ thisIsPlaylist: result, thisIsPlaylistCheckedAt: sql`now()` })
		.where(eq(artists.id, id));

	return c.json(result);
});

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
