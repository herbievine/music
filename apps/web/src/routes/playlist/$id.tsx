import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useCanGoBack,
	useNavigate,
	useParams,
	useRouter,
} from "@tanstack/react-router";
import { ChevronLeft, Heart, HeartOff, Play } from "lucide-react";
import { MediaHeader } from "../../components/media/header";
import { Button } from "../../components/ui/button";
import { useIsLiked, useLikeMutation } from "../../hooks/use-likes";
import { formatTime } from "../../lib/format-time";
import { client } from "../../lib/hono-rpc";
import { useQueueStore } from "../../store/queue";
import { toSimpleTrack } from "../../utils/to-simple-track";

export const Route = createFileRoute("/playlist/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const navigate = useNavigate();
	const { session } = useClerk();
	const { id } = useParams({ from: "/playlist/$id" });
	const { data } = useQuery({
		queryKey: ["playlist", id],
		queryFn: async () => {
			const res = await client.playlists[":id"].$get(
				{ param: { id } },
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error("Could not fetch playlist");
			}

			return res.json();
		},
	});
	const { play } = useQueueStore();
	const { isLiked, likeEntry } = useIsLiked(id, "playlist");
	const { like, unlike } = useLikeMutation();

	return (
		<div className="flex flex-col space-y-4">
			<button
				type="button"
				onClick={() =>
					canGoBack ? router.history.back() : navigate({ to: "/" })
				}
				className="py-1"
			>
				<ChevronLeft strokeWidth={2.5} size={20} />
			</button>
			<MediaHeader
				id={id}
				name={data?.name}
				imageUrl={
					(data && data.images.length > 0 && data.images[0].url) || undefined
				}
			/>
			<div className="flex space-x-4">
				<Button
					onClick={() => {
						if (data) {
							play(
								data.tracks.items.map(({ track }) =>
									toSimpleTrack(track, track.album),
								),
								0,
							);
						}
					}}
					className="flex space-x-2 items-center justify-center"
				>
					<Play strokeWidth={2.5} size={16} fill="#f4f4f5" />
					<span>Play</span>
				</Button>
				<Button
					onClick={() => {
						if (isLiked && likeEntry) {
							unlike.mutate(likeEntry.id);
						} else if (data) {
							like.mutate({
								itemId: id,
								itemType: "playlist",
								metadata: {
									name: data.name,
									image: data.images[0]?.url ?? "",
									artist: "",
								},
							});
						}
					}}
					className="flex space-x-2 items-center justify-center"
				>
					{isLiked ? (
						<HeartOff strokeWidth={2.5} size={16} />
					) : (
						<Heart strokeWidth={2.5} size={16} />
					)}
					<span>{isLiked ? "Remove" : "Like"}</span>
				</Button>
			</div>
			<div className="flex flex-col divide-y divide-zinc-800">
				{data
					? data.tracks.total > 0 &&
						data.tracks.items.map(({ track }) => (
							<button
								key={track.id}
								type="button"
								onClick={() => {
									play([toSimpleTrack(track, track.album)]);
								}}
								className="py-2 flex justify-between items-center"
							>
								<div className="flex flex-col items-start">
									<span className="line-clamp-1 text-left">{track.name}</span>
									<span className="text-sm text-zinc-500">
										{track.artists[0].name} - {formatTime(track.durationMs)}
									</span>
								</div>
							</button>
						))
					: [...new Array(12).fill("0")].map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: no other choice
								key={i}
								className="py-2 flex justify-between items-center"
							>
								<div className="flex flex-col items-start space-y-2">
									<div className="h-5 w-40 bg-zinc-800 rounded-2xl animate-pulse" />
									<div className="h-4 w-52 bg-zinc-800 rounded-2xl animate-pulse" />
								</div>
							</div>
						))}
			</div>
		</div>
	);
}
