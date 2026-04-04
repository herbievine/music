import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-rpc";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserPlaylist = {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
};

export type PlaylistTrackEntry = {
	id: string;
	playlistId: string;
	trackId: string;
	trackMetadata: {
		name: string;
		artists: string[];
		albumName: string;
		albumImage: string;
		durationMs: number;
	};
	position: number;
	addedAt: string;
};

export type UserPlaylistWithTracks = UserPlaylist & {
	tracks: PlaylistTrackEntry[];
};

// ─── Query keys ───────────────────────────────────────────────────────────────

export const playlistKeys = {
	all: ["user-playlists"] as const,
	list: () => ["user-playlists", "list"] as const,
	detail: (id: string) => ["user-playlists", "detail", id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useUserPlaylists() {
	const { session } = useClerk();
	return useQuery({
		queryKey: playlistKeys.list(),
		queryFn: async () => {
			const res = await client["user-playlists"].$get(
				{},
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to fetch playlists");
			return res.json() as Promise<{ playlists: UserPlaylist[] }>;
		},
	});
}

export function useUserPlaylist(id: string) {
	const { session } = useClerk();
	return useQuery({
		queryKey: playlistKeys.detail(id),
		queryFn: async () => {
			const res = await client["user-playlists"][":id"].$get(
				{ param: { id } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to fetch playlist");
			return res.json() as Promise<UserPlaylistWithTracks>;
		},
		enabled: !!id,
	});
}

export function useCreatePlaylist() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: { name: string; description?: string }) => {
			const res = await client["user-playlists"].$post(
				{ json: payload },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to create playlist");
			return res.json() as Promise<UserPlaylist>;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.list() });
		},
	});
}

export function useDeletePlaylist() {
	const { session } = useClerk();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const res = await client["user-playlists"][":id"].$delete(
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
		mutationFn: async (payload: {
			playlistId: string;
			trackId: string;
			trackMetadata: {
				name: string;
				artists: string[];
				albumName: string;
				albumImage: string;
				durationMs: number;
			};
		}) => {
			const res = await client["user-playlists"][":id"]["tracks"].$post(
				{
					param: { id: payload.playlistId },
					json: {
						trackId: payload.trackId,
						trackMetadata: payload.trackMetadata,
					},
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
		mutationFn: async (payload: { playlistId: string; entryId: string }) => {
			const res = await client["user-playlists"][":id"]["tracks"][":entryId"].$delete(
				{ param: { id: payload.playlistId, entryId: payload.entryId } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to remove track");
			return res.json();
		},
		onMutate: async ({ playlistId, entryId }) => {
			await queryClient.cancelQueries({ queryKey: playlistKeys.detail(playlistId) });
			const previous = queryClient.getQueryData<UserPlaylistWithTracks>(
				playlistKeys.detail(playlistId),
			);
			queryClient.setQueryData<UserPlaylistWithTracks>(
				playlistKeys.detail(playlistId),
				(old) => old ? { ...old, tracks: old.tracks.filter((t) => t.id !== entryId) } : old,
			);
			return { previous };
		},
		onError: (_err, { playlistId }, ctx) => {
			if (ctx?.previous) {
				queryClient.setQueryData(playlistKeys.detail(playlistId), ctx.previous);
			}
		},
		onSettled: (_data, _err, { playlistId }) => {
			queryClient.invalidateQueries({ queryKey: playlistKeys.detail(playlistId) });
		},
	});
}
