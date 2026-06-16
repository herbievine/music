import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-rpc";

export type SavedAlbum = {
	added_at: string;
	album: {
		id: string;
		name: string;
		artists: { id: string; name: string }[];
		images: { url: string; height?: number; width?: number }[];
	};
};

export const albumKeys = {
	all: ["albums"] as const,
	saved: (offset: number) => ["albums", "saved", offset] as const,
	contains: (ids: string[]) => ["albums", "contains", ids] as const,
};

export function useSaveAlbum() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (albumId: string) => {
			const res = await client.albums.$put(
				{ json: { albumId } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to save album");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: albumKeys.all });
		},
	});
}

export function useRemoveAlbum() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (albumId: string) => {
			const res = await client.albums.$delete(
				{ json: { albumId } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to remove album");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: albumKeys.all });
		},
	});
}

export function useCheckSavedAlbums(albumIds: string[]) {
	const { session } = useClerk();
	return useQuery({
		queryKey: albumKeys.contains(albumIds),
		queryFn: async () => {
			const res = await client.albums.contains.$post(
				{ json: { albumIds } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to check saved albums");
			return res.json() as Promise<boolean[]>;
		},
		enabled: albumIds.length > 0 && !!session,
	});
}

export function useSavedAlbums(offset = 0) {
	const { session } = useClerk();
	return useQuery({
		queryKey: albumKeys.saved(offset),
		queryFn: async () => {
			const res = await client.albums.saved.$get(
				{ query: { limit: "15", offset: String(offset) } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to fetch saved albums");
			return res.json() as Promise<{
				items: SavedAlbum[];
				total: number;
				limit: number;
				offset: number;
			}>;
		},
		enabled: !!session,
	});
}
