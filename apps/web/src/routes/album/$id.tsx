import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useCanGoBack,
	useNavigate,
	useParams,
	useRouter,
} from "@tanstack/react-router";
import { ChevronLeft, Play } from "lucide-react";
import { z } from "zod";
import { MediaHeader } from "../../components/media/header";
import { Button } from "../../components/ui/button";
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
	const { id } = useParams({ from: "/album/$id" });
	const { data } = useQuery({
		queryKey: ["album", id],
		queryFn: async () => {
			const res = await client.albums[":id"].$get({ param: { id } });

			if (!res.ok) {
				throw new Error("Could not fetch album");
			}

			const json = await res.json();

			return json;
		},
	});
	const { play } = useQueueStore();

	return (
		<div className="flex flex-col space-y-4">
			<button
				type="button"
				onClick={() =>
					canGoBack ? router.history.back() : navigate({ to: "/" })
				}
				className="px-4 py-1"
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
			<div className="px-4 flex space-x-4">
				<Button
					onClick={() => {
						if (data) {
							play(
								data.tracks.items.map((track) => toSimpleTrack(track, data)),
							);
						}
					}}
					className="flex space-x-2 items-center justify-center"
				>
					<Play strokeWidth={2.5} size={16} fill="#f4f4f5" />
					<span>Play</span>
				</Button>
				{/*<Button
					onClick={() => {
						if (isFavorite) {
							remove(id);
						} else if (album) {
							favorite(album);
						}
					}}
					className="flex space-x-2 items-center justify-center"
				>
					{isFavorite ? (
						<HeartOff strokeWidth={2.5} size={16} fill="#f4f4f5" />
					) : (
						<Heart strokeWidth={2.5} size={16} fill="#f4f4f5" />
					)}
					<span>{isFavorite ? "Remove" : "Add"}</span>
				</Button>*/}
			</div>
			<div className="flex flex-col divide-y divide-zinc-800">
				{data
					? data.tracks.total > 0 &&
						data.tracks.items.map((track) => (
							<button
								key={track.id}
								type="button"
								onClick={() => {
									play([toSimpleTrack(track, data)]);
								}}
								className="px-4 py-2 flex justify-between items-center"
							>
								<div className="flex flex-col items-start">
									<span className="line-clamp-1 text-left">{track.name}</span>
									<span className="text-sm text-zinc-500">
										{track.artists[0].name} - {formatTime(track.duration_ms)}
									</span>
								</div>
							</button>
						))
					: [...new Array(12).fill("0")].map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: no other choice
								key={i}
								className="px-4 py-2 flex justify-between items-center"
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
