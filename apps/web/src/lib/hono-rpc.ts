import type { AppType } from "@music/api";
import { hc } from "hono/client";

if (!process.env.VITE_API_URL) {
	throw new Error("VITE_API_URL not set");
}

export const client = hc<AppType>(process.env.VITE_API_URL, {
	init: {
		credentials: "include",
	},
});
