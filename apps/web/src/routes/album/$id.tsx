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
import { z } from "zod";
import { MediaHeader } from "../../components/media/header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useIsLiked, useLikeMutation } from "../../hooks/use-likes";
import { formatTime } from "../../lib/format-time";
import { client } from "../../lib/hono-rpc";
import { useQueueStore } from "../../store/queue";
import { toSimpleTrack } from "../../utils/to-simple-track";

export const Route = createFileRoute("/album/$id")({
	component: RouteComponent,
	validateSearch: z.object({
		back: z.string().default("/"),
	}),
});

function RouteComponent() {
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const navigate = useNavigate();
	const { session } = useClerk();
	const { id } = useParams({ from: "/album/$id" });
	const { data } = useQuery({
		queryKey: ["album", id],
		queryFn: async () => {
			const res = await client.albums[":id"].$get(
				{ param: { id } },
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);
			if (!res.ok) throw new Error("Could not fetch album");
			return res.json();
		},
	});
	const { play } = useQueueStore();
	const { isLiked, likeEntry } = useIsLiked(id, "album");
	const { like, unlike } = useLikeMutation();

	return (
		<div className="flex flex-col gap-5">
			<button
				type="button"
				onClick={() =>
					canGoBack ? router.history.back() : navigate({ to: "/" })
				}
				className="self-start text-muted-foreground hover:text-foreground transition-colors"
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

			<div className="flex gap-2">
				<Button
					onClick={() => {
						if (data) {
							play(
								data.tracks.items.map((track) => toSimpleTrack(track, data)),
								0,
							);
						}
					}}
					size="sm"
					className="gap-2"
				>
					<Play strokeWidth={2.5} size={14} fill="currentColor" />
					Play
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						if (isLiked && likeEntry) {
							unlike.mutate(likeEntry.id);
						} else if (data) {
							like.mutate({
								itemId: id,
								itemType: "album",
								metadata: {
									name: data.name,
									image: data.images[0]?.url ?? "",
									artist: data.artists[0]?.name ?? "",
								},
							});
						}
					}}
					className="gap-2"
				>
					{isLiked ? (
						<HeartOff strokeWidth={2.5} size={14} />
					) : (
						<Heart strokeWidth={2.5} size={14} />
					)}
					{isLiked ? "Remove" : "Like"}
				</Button>
			</div>

			<Separator />

			<div className="flex flex-col">
				{data
					? data.tracks.total > 0 &&
						data.tracks.items.map((track, i) => (
							<button
								key={track.id}
								type="button"
								onClick={() => {
									play([toSimpleTrack(track, data)]);
								}}
								className="py-2.5 px-3 -mx-3 flex justify-between items-center rounded-lg hover:bg-secondary/50 transition-colors group"
							>
								<div className="flex items-center gap-3 min-w-0">
									<span className="text-sm text-muted-foreground w-5 text-right flex-shrink-0 tabular-nums">
										{i + 1}
									</span>
									<div className="flex flex-col items-start min-w-0">
										<span className="line-clamp-1 text-left font-medium text-sm">
											{track.name}
										</span>
										<span className="text-xs text-muted-foreground">
											{track.artists[0].name}
										</span>
									</div>
								</div>
								<span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
									{formatTime(track.durationMs)}
								</span>
							</button>
						))
					: [...new Array(12).fill("0")].map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
								key={i}
								className="py-2.5 flex justify-between items-center"
							>
								<div className="flex flex-col gap-2">
									<div className="h-4 w-40 bg-secondary rounded-lg animate-pulse" />
									<div className="h-3 w-52 bg-secondary/70 rounded-lg animate-pulse" />
								</div>
							</div>
						))}
			</div>
		</div>
	);
}
