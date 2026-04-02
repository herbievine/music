import { getAuth } from "@hono/clerk-auth";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { MusicProvider } from "./music-provider.js";
import { SpotifyProvider } from "./spotify-provider.js";

export const providerMiddleware = createMiddleware(async (c, next) => {
	const auth = getAuth(c);
	const client = c.get("clerk");

	if (!auth?.userId) {
		return c.json({ message: "Not authenticated" }, 401);
	}

	const oauthTokens = await client.users.getUserOauthAccessToken(
		auth.userId,
		"spotify",
	);

	if (oauthTokens.totalCount === 0) {
		return c.json({ message: "No music provider connected" }, 401);
	}

	const { token } = oauthTokens.data[0];

	c.set("musicProvider", new SpotifyProvider(token));
	c.set("oauthToken", token);
	c.set("userId", auth.userId);

	return next();
});

export function getMusicProvider(c: Context): MusicProvider {
	return c.get("musicProvider") as MusicProvider;
}

export function getOAuthToken(c: Context): string {
	return c.get("oauthToken") as string;
}

export function getUserId(c: Context): string {
	return c.get("userId") as string;
}
