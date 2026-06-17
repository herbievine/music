import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useCanGoBack,
	useNavigate,
	useParams,
	useRouter,
} from "@tanstack/react-router";
import { ChevronLeft, Heart, HeartOff, ListEnd, MoreHorizontal, Pause, Pencil, Play, Radio, Shuffle, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import type { SpotifyPlaylist } from "../../api/user-playlists";
import { useDeletePlaylist, useRenamePlaylist } from "../../api/user-playlists";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useGoToRadio } from "../../api/radio";
import { Input } from "../../components/ui/input";
import { useIsLiked, useLikeMutation } from "../../hooks/use-likes";
import { useRecordClick } from "@/api/clicks";
import { shuffleTracks, useShufflePreference } from "../../hooks/use-shuffle-preference";
import { formatTime } from "../../lib/format-time";
import { client } from "../../lib/hono-rpc";
import { cn } from "@/lib/utils";
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
		queryFn: async (): Promise<SpotifyPlaylist> => {
			const res = await client.playlists[":id"].$get(
				{ param: { id } },
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);
			if (!res.ok) throw new Error("Could not fetch playlist");
			return (await res.json()) as SpotifyPlaylist;
		},
	});
	const { play, pause, add, songs, songIndex, isPlaying } = useQueueStore();
	const recordClick = useRecordClick();
	const { isLiked, likeEntry } = useIsLiked(id, "playlist");
	const { like, unlike } = useLikeMutation();
	const { shuffleOnPlay, toggle: toggleShuffleOnPlay } = useShufflePreference();
	const goToRadio = useGoToRadio();
	const renamePlaylist = useRenamePlaylist();
	const deletePlaylist = useDeletePlaylist();
	const [renameOpen, setRenameOpen] = useState(false);
	const [renameName, setRenameName] = useState("");
	const [deleteOpen, setDeleteOpen] = useState(false);

	function handleRename() {
		if (!renameName.trim()) return;
		renamePlaylist.mutate(
			{ id, name: renameName.trim() },
			{
				onSuccess: () => {
					setRenameOpen(false);
					toast.success("Playlist renamed");
				},
				onError: () => toast.error("Failed to rename playlist"),
			},
		);
	}

	function handleDelete() {
		deletePlaylist.mutate(id, {
			onSuccess: () => {
				setDeleteOpen(false);
				toast.success("Playlist deleted");
				if (canGoBack) { router.history.back(); } else { navigate({ to: "/playlists" }); }
			},
			onError: () => toast.error("Failed to delete playlist"),
		});
	}

	const imageUrl = data?.images?.[0]?.url;
	const totalMs =
		data?.items?.items?.reduce((acc: number, { item }) => acc + (item?.duration_ms || 0), 0) ?? 0;
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
					className="relative z-10 m-4 sm:m-6 mb-0 sm:mb-0 inline-flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
				>
					<ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
				</button>

				<div className="relative z-10 px-4 sm:px-8 pt-6 pb-8 flex flex-col lg:flex-row lg:items-end gap-6">
					{imageUrl ? (
						<img
							src={imageUrl}
							alt={data?.name}
							className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl shadow-2xl flex-shrink-0 object-cover mx-auto lg:mx-0"
							style={{ viewTransitionName: `key-${id}` }}
						/>
					) : (
						<div className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl bg-secondary flex-shrink-0 animate-pulse mx-auto lg:mx-0" />
					)}

					<div className="pb-1 min-w-0 text-center lg:text-left">
						<p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
							Playlist
						</p>
						{data ? (
							<h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 line-clamp-2">
								{data.name}
							</h1>
						) : (
							<div className="h-12 w-64 bg-white/20 rounded-lg animate-pulse mb-4" />
						)}
						<div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-1.5 gap-y-0.5 text-sm text-white/70">
							{data ? (
								<>
									<span>{data.items.total} songs</span>
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
			<div className="px-4 sm:px-8 py-4 flex items-center gap-5">
				<button
					type="button"
					onClick={() => {
						if (!data) return;
						const tracks = data.items.items.map(({ item }) =>
							toSimpleTrack(
								{ ...item, durationMs: item.duration_ms } as any,
								item.album as any,
							),
						);
						play(shuffleOnPlay ? shuffleTracks(tracks) : tracks, 0);
					recordClick.mutate({
						contextType: "playlist",
						contextId: id,
						metadata: {
							name: data.name,
							images: data.images,
							description: data.description ?? undefined,
						},
					});
					}}
					className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-100 rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0"
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
						"w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center transition-colors",
						isLiked
							? "text-emerald-400 hover:text-emerald-300"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{isLiked ? <HeartOff className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
				</button>

				<button
					type="button"
					onClick={toggleShuffleOnPlay}
					title={shuffleOnPlay ? "Shuffle on play: on" : "Shuffle on play: off"}
					className={cn(
						"w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center transition-colors",
						shuffleOnPlay
							? "text-emerald-400 hover:text-emerald-300"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Shuffle className="w-5 h-5" />
				</button>

				<DropdownMenu>
					<DropdownMenuTrigger
						title="More options"
						className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground focus:outline-none"
					>
						<MoreHorizontal className="w-5 h-5" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							onSelect={() => {
								if (!data) return;
								const tracks = data.items.items.map(({ item }) =>
									toSimpleTrack(
										{ ...item, durationMs: item.duration_ms } as any,
										item.album as any,
									),
								);
								add(shuffleOnPlay ? shuffleTracks(tracks) : tracks);
								toast.success(`Added ${data.items.total} tracks to queue`);
							}}
						>
							<ListEnd className="w-4 h-4" />
							Add to queue
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={() => {
								setRenameName(data?.name ?? "");
								setRenameOpen(true);
							}}
						>
							<Pencil className="w-4 h-4" />
							Rename
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => setDeleteOpen(true)}
							className="text-destructive focus:text-destructive"
						>
							<Trash2 className="w-4 h-4" />
							Delete playlist
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Track list */}
			<div className="px-4 sm:px-8 pb-8">
				<div className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_2.75rem] items-center border-b border-border/50 pb-2 mb-1 text-xs uppercase tracking-wider text-muted-foreground select-none">
					<span className="text-center">#</span>
					<span className="pl-3">Title</span>
					<span>Duration</span>
					<span className="hidden sm:block" />
				</div>

				{data
					? data.items.total > 0 &&
						data.items.items.map(({ item }, i) => {
							const isCurrentTrack = item.id === currentSongId;
							const playTrack = () => {
								if (isCurrentTrack && isPlaying) {
									pause();
								} else {
									play([toSimpleTrack({ ...item, durationMs: item.duration_ms } as any, item.album as any)]);
									recordClick.mutate({
										contextType: "track",
										contextId: item.id,
										metadata: {
											name: item.name,
											images: item.album.images,
											artists: item.artists,
											durationMs: item.duration_ms,
											album: {
												id: item.album.id,
												name: item.album.name,
												images: item.album.images,
												releaseDate: "",
											},
										},
									});
								}
							};
							return (
								<div
									key={item.id}
									role="button"
									tabIndex={0}
									onClick={playTrack}
									onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playTrack(); } }}
									className={cn(
										"grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_auto_2.75rem] items-center py-2.5 rounded-md transition-colors group cursor-pointer select-none",
										"hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none",
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

									<span className="pl-3 min-w-0 flex flex-col text-left">
										<span className={cn(
											"text-sm font-medium truncate",
											isCurrentTrack ? "text-primary" : "text-foreground",
										)}>
											{item.name}
										</span>
										<span className="text-xs text-muted-foreground truncate">
											{item.artists.map((a) => a.name).join(", ")}
											{" · "}
											{item.album.name}
										</span>
									</span>

									<span className="text-xs text-muted-foreground tabular-nums">
										{formatTime(item.duration_ms)}
									</span>

									{/* Track options */}
									<DropdownMenu>
										<DropdownMenuTrigger
											title="More options"
											onClick={(e) => e.stopPropagation()}
											className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-all text-muted-foreground hover:text-foreground hover:bg-white/10 data-[state=open]:bg-white/10 focus:outline-none"
										>
											<MoreHorizontal className="w-4 h-4" />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
											<DropdownMenuItem
												onSelect={() => { add([toSimpleTrack({ ...item, durationMs: item.duration_ms } as any, item.album as any)]); toast.success("Added to queue"); }}
											>
												<ListEnd className="w-4 h-4" />
												Add to queue
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onSelect={() => goToRadio.mutate(item.id)}
												disabled={goToRadio.isPending}
											>
												<Radio className="w-4 h-4" />
												Go to radio
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
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

			{/* Rename dialog */}
			<Dialog open={renameOpen} onOpenChange={setRenameOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename playlist</DialogTitle>
					</DialogHeader>
					<Input
						autoFocus
						value={renameName}
						onChange={(e) => setRenameName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleRename();
							if (e.key === "Escape") setRenameOpen(false);
						}}
						maxLength={100}
					/>
					<DialogFooter>
						<button
							type="button"
							onClick={() => setRenameOpen(false)}
							className="px-4 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleRename}
							disabled={!renameName.trim() || renamePlaylist.isPending}
							className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
						>
							{renamePlaylist.isPending ? "Saving…" : "Save"}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation dialog */}
			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete playlist?</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						This will unfollow <span className="text-foreground font-medium">{data?.name}</span>. This action cannot be undone.
					</p>
					<DialogFooter>
						<button
							type="button"
							onClick={() => setDeleteOpen(false)}
							className="px-4 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={deletePlaylist.isPending}
							className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
						>
							{deletePlaylist.isPending ? "Deleting…" : "Delete"}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
