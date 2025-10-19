import type { AppType } from "@music/api";
import { hc } from "hono/client";

export const client = hc<AppType>("http://localhost:3000", {
	init: {
		credentials: "include",
	},
});
