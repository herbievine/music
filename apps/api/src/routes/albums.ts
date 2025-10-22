import { getAuth } from "@hono/clerk-auth";
import type { Album, CursorPagingObject } from "@statsfm/spotify.js";
import { Hono } from "hono";
import { spotifyClient } from "../lib/spotify.js";
import { fetcher } from "../utils/fetcher.js";

const app = new Hono();

export default app
	.get("/:id", async (c) => {
		const auth = getAuth(c);
		const client = c.get("clerk");

		if (!auth?.userId) {
			return c.json({}, 500);
		}

		const oauthTokens = await client.users.getUserOauthAccessToken(
			auth?.userId,
			"spotify",
		);

		if (oauthTokens.totalCount === 0) {
			return c.json({ error: true }, 500);
		}

		const { token } = oauthTokens.data[0];

		const album = await spotifyClient(token).albums.get(c.req.param("id"));

		return c.json(album);
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

		const url = new URL("/v1/me/albums", "https://api.spotify.com");

		url.searchParams.append("limit", "10");
		url.searchParams.append("offset", "0");

		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			return c.json({ message: "Could not retrieve user albums" }, 500);
		}

		const albums = (await res.json()) as {
			href: string;
			items: { added_at: string; album: Album }[];
		};

		return c.json(albums);
	});
