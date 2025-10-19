import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { spotifyClient } from "../lib/spotify.js";

const app = new Hono();

export default app
	.get("/:id", async (c) => {
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

		const playlist = await spotifyClient(token).playlist.get(c.req.param("id"));

		return c.json(playlist);
	})
	.get("/", async (c) => {
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

		const playlists = await spotifyClient(token).me.playlists();

		return c.json(playlists);
	});
