import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../lib/hono-rpc";

export function useLikes(type?: "track" | "album" | "playlist") {
	const { session } = useClerk();

	return useQuery({
		queryKey: ["likes", type],
		queryFn: async () => {
			const res = await client.likes.$get(
				{ query: { type } },
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error("Failed to fetch likes");
			}

			return res.json();
		},
	});
}

export function useIsLiked(
	itemId: string,
	itemType: "track" | "album" | "playlist",
) {
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
		mutationFn: async (data: {
			itemId: string;
			itemType: "track" | "album" | "playlist";
			metadata: { name: string; image: string; artist: string };
		}) => {
			const res = await client.likes.$post(
				{ json: data },
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error("Failed to like");
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["likes"] });
		},
	});

	const unlike = useMutation({
		mutationFn: async (id: string) => {
			const res = await client.likes[":id"].$delete(
				{ param: { id } },
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error("Failed to unlike");
			}

			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["likes"] });
		},
	});

	return { like, unlike };
}
