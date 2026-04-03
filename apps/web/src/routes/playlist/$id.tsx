import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useCanGoBack,
	useNavigate,
	useParams,
	useRouter,
} from "@tanstack/react-router";
import { ChevronLeft, Heart, HeartOff, Pause, Play } from "lucide-react";
import { useIsLiked, useLikeMutation } from "../../hooks/use-likes";
import { formatTime } from "../../lib/format-time";
import { client } from "../../lib/hono-rpc";
import { useQueueStore } from "../../store/queue";
import { toSimpleTrack } from "../../utils/to-simple-track";
import { cn } from "@/lib/utils";

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
			if (!res.ok) throw new Error("Could not fetch playlist");
			return res.json();
		},
	});
	const { play, pause, songs, songIndex, isPlaying } = useQueueStore();
	const { isLiked, likeEntry } = useIsLiked(id, "playlist");
	const { like, unlike } = useLikeMutation();

	const imageUrl = data?.images?.[0]?.url;
	const totalMs = data?.tracks.items.reduce((acc, { track }) => acc + track.durationMs, 0) ?? 0;
	const totalMin = Math.floor(totalMs / 60000);
	const currentSongId = songs[songIndex]?.id;

	return (
		<div className="flex flex-col">
			{/* Hero — full bleed */}
			<div className="relative">
				{imageUrl && (
					<div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
						<img
							src={imageUrl}
							className="w-full h-full object-cover scale-110 blur-3xl opacity-60 saturate-150"
						/>
						<div className="absolute inset-0 bg-gradient-to-b from-black/30 via-card/80 to-card" />
					</div>
				)}

				<button
					type="button"
					onClick={() => canGoBack ? router.history.back() : navigate({ to: "/" })}
					className="relative z-10 m-6 mb-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
				>
					<ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
				</button>

				<div className="relative z-10 px-8 pt-6 pb-8 flex items-end gap-6">
					{imageUrl ? (
						<img
							src={imageUrl}
							alt={data?.name}
							className="w-48 h-48 rounded-xl shadow-2xl flex-shrink-0 object-cover"
							style={{ viewTransitionName: `key-${id}` }}
						/>
					) : (
						<div className="w-48 h-48 rounded-xl bg-secondary flex-shrink-0 animate-pulse" />
					)}

					<div className="pb-1 min-w-0">
						<p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
							Playlist
						</p>
						{data ? (
							<h1 className="text-4xl lg:text-5xl font-black text-white leading-none mb-4 truncate">
								{data.name}
							</h1>
						) : (
							<div className="h-12 w-64 bg-white/20 rounded-lg animate-pulse mb-4" />
						)}
						<div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-white/70">
							{data ? (
								<>
									<span>{data.tracks.total} songs</span>
									{totalMin > 0 && (
										<><span>•</span><span>about {totalMin} min</span></>
									)}
								</>
							) : (
								<div className="h-4 w-48 bg-white/20 rounded animate-pulse" />
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Actions bar */}
			<div className="px-8 py-4 flex items-center gap-5">
				<button
					type="button"
					onClick={() => {
						if (data) {
							play(
								data.tracks.items.map(({ track }) => toSimpleTrack(track, track.album)),
								0,
							);
						}
					}}
					className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-100 rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0"
				>
					<Play className="w-6 h-6 text-black fill-black ml-0.5" />
				</button>

				<button
					type="button"
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
					className={cn(
						"w-8 h-8 flex items-center justify-center transition-colors",
						isLiked
							? "text-emerald-400 hover:text-emerald-300"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{isLiked ? <HeartOff className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
				</button>
			</div>

			{/* Track list */}
			<div className="px-8 pb-8">
				<div className="grid grid-cols-[2rem_1fr_auto] items-center border-b border-border/50 pb-2 mb-1 text-xs uppercase tracking-wider text-muted-foreground select-none">
					<span className="text-center">#</span>
					<span className="pl-3">Title</span>
					<span>Duration</span>
				</div>

				{data
					? data.tracks.total > 0 &&
						data.tracks.items.map(({ track }, i) => {
							const isCurrentTrack = track.id === currentSongId;
							return (
								<button
									key={track.id}
									type="button"
									onClick={() => { if (isCurrentTrack && isPlaying) { pause(); } else { play([toSimpleTrack(track, track.album)]); } }}
									className={cn(
										"w-full grid grid-cols-[2rem_1fr_auto] items-center py-2.5 rounded-md transition-colors group text-left",
										"hover:bg-white/5",
									)}
								>
									<span className="text-sm text-center flex items-center justify-center">
										{isCurrentTrack && isPlaying ? (
											<Pause className="w-3.5 h-3.5 fill-current text-primary" />
										) : (
											<>
												<span className={cn("tabular-nums group-hover:hidden", isCurrentTrack ? "text-primary" : "text-muted-foreground")}>
													{i + 1}
												</span>
												<Play className="hidden group-hover:block w-3.5 h-3.5 fill-current" />
											</>
										)}
									</span>

									<div className="pl-3 min-w-0 flex flex-col">
										<span className={cn(
											"text-sm font-medium truncate",
											isCurrentTrack ? "text-primary" : "text-foreground",
										)}>
											{track.name}
										</span>
										<span className="text-xs text-muted-foreground truncate">
											{track.artists.map((a) => a.name).join(", ")}
											{" · "}
											{track.album.name}
										</span>
									</div>

									<span className="text-xs text-muted-foreground tabular-nums">
										{formatTime(track.durationMs)}
									</span>
								</button>
							);
						})
					: [...Array(12)].map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<div key={i} className="grid grid-cols-[2rem_1fr_auto] items-center py-3">
								<div />
								<div className="pl-3 flex flex-col gap-1.5">
									<div className="h-4 w-44 bg-secondary rounded animate-pulse" />
									<div className="h-3 w-28 bg-secondary/60 rounded animate-pulse" />
								</div>
								<div className="h-3 w-8 bg-secondary/60 rounded animate-pulse" />
							</div>
						))}
			</div>
		</div>
	);
}
