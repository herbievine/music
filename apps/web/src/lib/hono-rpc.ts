import type { AppType } from "@music/api";
import { hc } from "hono/client";

if (!import.meta.env.VITE_API_URL) {
	throw new Error("VITE_API_URL not set");
}

export const client = hc<AppType>(import.meta.env.VITE_API_URL);

// export function useApiClient() {
// 	const { session } = useClerk();

// 	if (!session) {
// 		throw new Error("Using API Client but not auted");
// 	}

// 	return hc<AppType>(import.meta.env.VITE_API_URL, {
// 		headers: {
// 			Authorization: `Bearer ${asession.getToken}`,
// 		},
// 	});
// }
