import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-rpc";
import { likesKeys } from "./likes";
import { playlistKeys } from "./user-playlists";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncTrack = {
	id: string;
	name: string;
	artists: string[];
	albumName: string;
	albumImage: string;
	durationMs: number;
	imported: boolean;
};

export type SyncAlbum = {
	id: string;
	name: string;
	image: string;
	artist: string;
	imported: boolean;
};

export type SyncPlaylist = {
	id: string;
	name: string;
	description: string;
	image: string;
	imported: boolean;
};

export type SyncStatus = {
	tracks: SyncTrack[];
	albums: SyncAlbum[];
	playlists: SyncPlaylist[];
};

export type ImportSelection = {
	tracks: Omit<SyncTrack, "imported">[];
	albums: Omit<SyncAlbum, "imported">[];
	playlistIds: string[];
};

export type ImportResult = {
	tracksImported: number;
	albumsImported: number;
	playlistsImported: number;
};

// ─── Query keys ───────────────────────────────────────────────────────────────

export const syncKeys = {
	all: ["sync"] as const,
	status: () => ["sync", "status"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSyncStatus() {
	const { session } = useClerk();
	return useQuery({
		queryKey: syncKeys.status(),
		queryFn: async (): Promise<SyncStatus> => {
			const res = await client.sync.status.$get(
				{},
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to load sync status");
			return res.json() as Promise<SyncStatus>;
		},
	});
}

export function useImportLibrary() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (selection: ImportSelection): Promise<ImportResult> => {
			const res = await client.sync.import.$post(
				{ json: selection },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Import failed");
			return res.json() as Promise<ImportResult>;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: syncKeys.all });
			queryClient.invalidateQueries({ queryKey: likesKeys.all });
			queryClient.invalidateQueries({ queryKey: playlistKeys.all });
		},
	});
}
