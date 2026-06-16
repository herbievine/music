import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-rpc";

export type ClickContextType = "album" | "playlist" | "track";

type ClickPayload = {
	contextType: ClickContextType;
	contextId: string;
	metadata: {
		name: string;
		images: { url: string; width?: number; height?: number }[];
		artists?: { id: string; name: string }[];
		description?: string;
		releaseDate?: string;
		durationMs?: number;
		album?: {
			id: string;
			name: string;
			images: { url: string; width?: number; height?: number }[];
			releaseDate: string;
		};
	};
};

export function useRecordClick() {
	const { session } = useClerk();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: ClickPayload) => {
			const res = await client.clicks.$post(
				{ json: payload },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to record click");
			return res.json();
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["home"] });
		},
	});
}
