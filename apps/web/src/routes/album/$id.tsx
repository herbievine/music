import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import {
	Link,
	createFileRoute,
	useCanGoBack,
	useNavigate,
	useParams,
	useRouter,
} from "@tanstack/react-router";
import { ChevronLeft, Heart, HeartOff, ListPlus, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { AddToPlaylistDialog } from "../../components/add-to-playlist-dialog";
import { z } from "zod";
import { formatTime } from "../../lib/format-time";
import { client } from "../../lib/hono-rpc";
import { useQueueStore } from "../../store/queue";
import { toSimpleTrack } from "../../utils/to-simple-track";
import { cn } from "@/lib/utils";
import { useSaveAlbum, useRemoveAlbum, useCheckSavedAlbums } from "../../api/albums";

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
	const { play, pause, songs, songIndex, isPlaying } = useQueueStore();
	const saveAlbum = useSaveAlbum();
	const removeAlbum = useRemoveAlbum();
	const { data: savedStatus } = useCheckSavedAlbums(data ? [id] : []);
	const [isSaved, setIsSaved] = useState(false);

	useEffect(() => {
		if (savedStatus && savedStatus.length > 0) {
			setIsSaved(savedStatus[0]);
		}
	}, [savedStatus]);

	const imageUrl = data?.images?.[0]?.url;
	const totalMs = data?.tracks.items.reduce((acc, t) => acc + t.durationMs, 0) ?? 0;
	const totalMin = Math.floor(totalMs / 60000);
	const year = data && "releaseDate" in data
		? String((data as { releaseDate: string }).releaseDate).slice(0, 4)
		: null;

	const currentSongId = songs[songIndex]?.id;
	const [dialogTrack, setDialogTrack] = useState<null | {
		id: string; name: string; artists: string[]; albumName: string; albumImage: string; durationMs: number;
	}>(null);

	return (
		<>
			<div className="flex flex-col">
				{/* Hero — full bleed */}
			<div className="relative">
				{/* Blurred art background */}
				{imageUrl && (
					<div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
						<img
							src={imageUrl}
							className="w-full h-full object-cover scale-110 blur-3xl opacity-60 saturate-150"
						/>
						<div className="absolute inset-0 bg-gradient-to-b from-black/30 via-card/80 to-card" />
					</div>
				)}

				{/* Back button */}
				<button
					type="button"
					onClick={() => canGoBack ? router.history.back() : navigate({ to: "/" })}
					className="relative z-10 m-6 mb-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
				>
					<ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
				</button>

				{/* Header content */}
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
							Album
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
									<span className="font-semibold text-white">
										{data.artists.map((a, i) => (
											<span key={a.id}>
												{i > 0 && ", "}
												<Link
													to="/artist/$id"
													params={{ id: a.id }}
													className="hover:underline"
												>
													{a.name}
												</Link>
											</span>
										))}
									</span>
									{year && <><span>•</span><span>{year}</span></>}
									<span>•</span>
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
							play(data.tracks.items.map((t) => toSimpleTrack(t, data)), 0);
						}
					}}
					className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-100 rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0"
				>
					<Play className="w-6 h-6 text-black fill-black ml-0.5" />
				</button>

				<button
					type="button"
					onClick={() => {
						if (isSaved) {
							removeAlbum.mutate(id, {
								onSuccess: () => setIsSaved(false),
							});
						} else {
							saveAlbum.mutate(id, {
								onSuccess: () => setIsSaved(true),
							});
						}
					}}
					className={cn(
						"w-8 h-8 flex items-center justify-center transition-colors",
						isSaved
							? "text-emerald-400 hover:text-emerald-300"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{isSaved ? <HeartOff className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
				</button>
			</div>

			{/* Track list */}
			<div className="px-8 pb-8">
				{/* Column headers */}
				<div className="grid grid-cols-[2rem_1fr_auto_1.75rem] items-center border-b border-border/50 pb-2 mb-1 text-xs uppercase tracking-wider text-muted-foreground select-none">
					<span className="text-center">#</span>
					<span className="pl-3">Title</span>
					<span>Duration</span>
					<span />
				</div>

				{data
					? data.tracks.total > 0 &&
						data.tracks.items.map((track, i) => {
							const isCurrentTrack = track.id === currentSongId;
							return (
								<div
									key={track.id}
									className={cn(
										"grid grid-cols-[2rem_1fr_auto_1.75rem] items-center px-0 py-2.5 rounded-md transition-colors group",
										"hover:bg-white/5",
										isCurrentTrack && "text-primary",
									)}
								>
									{/* Number / play / pause */}
									<button
										type="button"
										onClick={() => { if (isCurrentTrack && isPlaying) pause(); else play([toSimpleTrack(track, data)]); }}
										className="text-sm text-center flex items-center justify-center"
									>
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
									</button>

									{/* Track info */}
									<button
										type="button"
										onClick={() => { if (isCurrentTrack && isPlaying) pause(); else play([toSimpleTrack(track, data)]); }}
										className="pl-3 min-w-0 flex flex-col text-left"
									>
										<span className={cn("text-sm font-medium truncate", isCurrentTrack ? "text-primary" : "text-foreground")}>
											{track.name}
										</span>
										<span className="text-xs text-muted-foreground truncate">
											{track.artists.map((a) => a.name).join(", ")}
										</span>
									</button>

									{/* Duration */}
									<span className="text-xs text-muted-foreground tabular-nums">
										{formatTime(track.durationMs)}
									</span>

									{/* Add to playlist */}
									<button
										type="button"
										onClick={() => setDialogTrack({
											id: track.id,
											name: track.name,
											artists: track.artists.map((a) => a.name),
											albumName: data.name,
											albumImage: data.images[0]?.url ?? "",
											durationMs: track.durationMs,
										})}
										className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-foreground"
									>
										<ListPlus className="w-3.5 h-3.5" />
									</button>
								</div>
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

		{dialogTrack && (
			<AddToPlaylistDialog
				track={dialogTrack}
				open={!!dialogTrack}
				onOpenChange={(open) => { if (!open) setDialogTrack(null); }}
			/>
		)}
		</>
	);
}
