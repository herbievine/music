import { useClerk } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";
import { client } from "@/lib/hono-rpc";

export function useGoToRadio() {
	const { session } = useClerk();
	const navigate = useNavigate();
	return useMutation({
		mutationFn: async (trackId: string) => {
			const res = await client.playlists.radio[":trackId"].$get(
				{ param: { trackId } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Failed to fetch radio playlist");
			return res.json();
		},
		onSuccess: ({ playlistId }) => {
			navigate({ to: "/playlist/$id", params: { id: playlistId } });
		},
		onError: () => toast.error("Could not start radio"),
	});
}
