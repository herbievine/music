import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono-rpc";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LikeItemType = "track" | "album" | "playlist";

export type Like = {
	id: string;
	itemId: string;
	itemType: LikeItemType;
	metadata: { name: string; image: string; artist: string };
	createdAt: string;
};

export type LikesData = { items: Like[] };

// ─── Query key factory ────────────────────────────────────────────────────────

export const likesKeys = {
	all: ["likes"] as const,
	list: (type?: LikeItemType) => ["likes", type] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useLikes(type?: LikeItemType) {
	const { session } = useClerk();

	return useQuery({
		queryKey: likesKeys.list(type),
		queryFn: async (): Promise<LikesData> => {
			const res = await client.likes.$get(
				{ query: { type } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to fetch likes");
			return res.json() as Promise<LikesData>;
		},
	});
}

export function useIsLiked(itemId: string, itemType: LikeItemType) {
	const { data } = useLikes();
	const match = data?.items.find(
		(l) => l.itemId === itemId && l.itemType === itemType,
	);
	return { isLiked: !!match, likeEntry: match };
}

export function useLikeMutation() {
	const { session } = useClerk();
	const queryClient = useQueryClient();

	const like = useMutation({
		mutationFn: async (payload: {
			itemId: string;
			itemType: LikeItemType;
			metadata: { name: string; image: string; artist: string };
		}) => {
			const res = await client.likes.$post(
				{ json: payload },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to like");
			return res.json();
		},
		// Optimistically add to the unfiltered list immediately
		onMutate: async (payload) => {
			await queryClient.cancelQueries({ queryKey: likesKeys.all });
			const previous = queryClient.getQueryData<LikesData>(likesKeys.list());
			queryClient.setQueryData<LikesData>(likesKeys.list(), (old) => ({
				items: [
					...(old?.items ?? []),
					{
						id: `optimistic-${Date.now()}`,
						...payload,
						createdAt: new Date().toISOString(),
					},
				],
			}));
			return { previous };
		},
		onError: (_err, _payload, ctx) => {
			if (ctx?.previous) {
				queryClient.setQueryData(likesKeys.list(), ctx.previous);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: likesKeys.all });
		},
	});

	const unlike = useMutation({
		mutationFn: async (id: string) => {
			const res = await client.likes[":id"].$delete(
				{ param: { id } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to unlike");
			return res.json();
		},
		// Optimistically remove by id immediately
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: likesKeys.all });
			const previous = queryClient.getQueryData<LikesData>(likesKeys.list());
			queryClient.setQueryData<LikesData>(likesKeys.list(), (old) => ({
				items: (old?.items ?? []).filter((l) => l.id !== id),
			}));
			return { previous };
		},
		onError: (_err, _id, ctx) => {
			if (ctx?.previous) {
				queryClient.setQueryData(likesKeys.list(), ctx.previous);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: likesKeys.all });
		},
	});

	return { like, unlike };
}
