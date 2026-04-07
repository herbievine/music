import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { client } from "../lib/hono-rpc";

export const lyricsKeys = {
	all: ["lyrics"] as const,
	byTrack: (trackId: string) => ["lyrics", trackId] as const,
};

export function useLyrics(
	trackId: string,
	title: string,
	artist: string,
	durationMs: number,
) {
	const { session } = useClerk();

	return useQuery({
		queryKey: lyricsKeys.byTrack(trackId),
		queryFn: async () => {
			const res = await client.lyrics.$get(
				{
					query: {
						trackId,
						title,
						artist,
						durationSeconds: String(Math.round(durationMs / 1000)),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error("Failed to fetch lyrics");
			}

			return res.json();
		},
		staleTime: Infinity,
		enabled: !!trackId && !!session,
	});
}
