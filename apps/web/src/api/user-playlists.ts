import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-rpc";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpotifyTrack = {
	id: string;
	name: string;
	duration_ms: number;
	artists: { id: string; name: string }[];
	album: {
		id: string;
		name: string;
		images: { url: string; height?: number; width?: number }[];
	};
};

export type SpotifyPlaylistItem = {
	added_at: string;
	added_by: { id: string };
	is_local: boolean;
	item: SpotifyTrack;
};

export type SpotifyPlaylist = {
	id: string;
	name: string;
	description: string | null;
	images: { url: string; height?: number; width?: number }[];
	items: {
		total: number;
		items: SpotifyPlaylistItem[];
	};
	public: boolean;
	collaborative: boolean;
	owner: { display_name: string };
};

// ─── Query keys ───────────────────────────────────────────────────────────────

export const playlistKeys = {
	all: ["playlists"] as const,
	list: (offset: number) => ["playlists", "list", offset] as const,
	detail: (id: string) => ["playlists", "detail", id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useUserPlaylists(offset = 0) {
	const { session } = useClerk();
	return useQuery({
		queryKey: playlistKeys.list(offset),
		queryFn: async () => {
			const res = await client.playlists.$get(
				{ query: { limit: "15", offset: String(offset) } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to fetch playlists");
			return res.json() as Promise<{ playlists: SpotifyPlaylist[]; total: number; limit: number; offset: number }>;
		},
	});
}

export function useUserPlaylist(id: string) {
	const { session } = useClerk();
	return useQuery({
		queryKey: playlistKeys.detail(id),
		queryFn: async () => {
			const res = await client.playlists[":id"].$get(
				{ param: { id } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to fetch playlist");
			return res.json() as Promise<SpotifyPlaylist>;
		},
		enabled: !!id,
	});
}

export function useCreatePlaylist() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: { name: string; description?: string; isPublic?: boolean }) => {
			const res = await client.playlists.$post(
				{ json: payload },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to create playlist");
			return res.json() as Promise<SpotifyPlaylist>;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.all });
		},
	});
}

export function useRenamePlaylist() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: { id: string; name: string }) => {
			const res = await client.playlists[":id"].$patch(
				{ param: { id: payload.id }, json: { name: payload.name } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to rename playlist");
			return res.json();
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.all });
			queryClient.invalidateQueries({ queryKey: ["playlist", variables.id] });
		},
	});
}

export function useDeletePlaylist() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const res = await client.playlists[":id"].$delete(
				{ param: { id } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to delete playlist");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.all });
		},
	});
}

export function useAddTrackToPlaylist() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: { playlistId: string; trackId: string }) => {
			const res = await client.playlists[":id"].tracks.$post(
				{
					param: { id: payload.playlistId },
					json: { trackId: payload.trackId },
				},
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to add track");
			return res.json();
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: playlistKeys.detail(variables.playlistId),
			});
		},
	});
}

export function useRemoveTrackFromPlaylist() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: { playlistId: string; trackId: string }) => {
			const res = await client.playlists[":id"].tracks[":trackId"].$delete(
				{ param: { id: payload.playlistId, trackId: payload.trackId } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to remove track");
			return res.json();
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.detail(variables.playlistId) });
		},
	});
}
