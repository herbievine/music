import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft, ListMusic, Pause, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	useUserPlaylist,
	useDeletePlaylist,
	useRemoveTrackFromPlaylist,
} from "@/api/user-playlists";
import { useQueueStore } from "../../store/queue";
import { formatTime } from "../../lib/format-time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-playlist/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/my-playlist/$id" });
	const navigate = useNavigate();
	const { data, isLoading } = useUserPlaylist(id);
	const deletePlaylist = useDeletePlaylist();
	const removeTrack = useRemoveTrackFromPlaylist();
	const { play, pause, songs, songIndex, isPlaying } = useQueueStore();
	const [confirmDelete, setConfirmDelete] = useState(false);

	const currentSongId = songs[songIndex]?.id;

	function handlePlay(startIndex = 0) {
		if (!data?.tracks.length) return;
		play(
			data.tracks.map((t) => ({
				id: t.trackId,
				name: t.trackMetadata.name,
				artists: t.trackMetadata.artists.map((name) => ({ id: name, name })),
				album: {
					id: t.trackId,
					name: t.trackMetadata.albumName,
					image: t.trackMetadata.albumImage,
				},
				durationMs: t.trackMetadata.durationMs,
			})),
			startIndex,
		);
	}

	function handleDelete() {
		if (!confirmDelete) { setConfirmDelete(true); return; }
		deletePlaylist.mutate(id, { onSuccess: () => navigate({ to: "/library" }) });
	}

	if (isLoading) return <PlaylistSkeleton />;
	if (!data) return (
		<div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
			<ListMusic className="w-10 h-10" strokeWidth={1} />
			<p className="text-sm">Playlist not found</p>
		</div>
	);

	const totalMs = data.tracks.reduce((acc, t) => acc + t.trackMetadata.durationMs, 0);
	const totalMin = Math.floor(totalMs / 60000);

	return (
		<div className="flex flex-col">
			{/* Hero */}
			<div className="relative">
				{/* Gradient background */}
				<div className="absolute inset-0 bg-gradient-to-b from-emerald-900/40 to-transparent pointer-events-none" />

				<div className="relative px-8 pt-10 pb-6">
					{/* Back */}
					<button
						type="button"
						onClick={() => navigate({ to: "/library" })}
						className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-6 transition-colors"
					>
						<ChevronLeft className="w-4 h-4" />
						Library
					</button>

					<div className="flex items-end gap-6">
						{/* Cover placeholder */}
						<div className="w-40 h-40 rounded-xl bg-card border border-white/10 flex items-center justify-center flex-shrink-0 shadow-2xl">
							<ListMusic className="w-16 h-16 text-white/20" strokeWidth={1} />
						</div>

						<div className="min-w-0 pb-2">
							<p className="text-xs text-white/50 uppercase tracking-wider mb-1">Playlist</p>
							<h1 className="text-3xl font-bold text-white truncate mb-2">{data.name}</h1>
							{data.description && (
								<p className="text-sm text-white/60 mb-3 line-clamp-2">{data.description}</p>
							)}
							<div className="flex flex-wrap items-center gap-x-1.5 text-sm text-white/50">
								<span>{data.tracks.length} songs</span>
								{totalMin > 0 && <><span>·</span><span>about {totalMin} min</span></>}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="px-8 py-4 flex items-center gap-4">
				<button
					type="button"
					onClick={() => handlePlay(0)}
					disabled={data.tracks.length === 0}
					className="w-14 h-14 bg-emerald-500 hover:bg-emerald-400 hover:scale-105 active:scale-100 rounded-full flex items-center justify-center shadow-lg transition-all flex-shrink-0 disabled:opacity-40 disabled:pointer-events-none"
				>
					<Play className="w-6 h-6 text-black fill-black ml-0.5" />
				</button>

				<button
					type="button"
					onClick={handleDelete}
					className={cn(
						"flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors",
						confirmDelete
							? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
							: "text-muted-foreground hover:text-foreground hover:bg-white/5",
					)}
				>
					<Trash2 className="w-4 h-4" />
					{confirmDelete ? "Confirm delete" : "Delete"}
				</button>
				{confirmDelete && (
					<button
						type="button"
						onClick={() => setConfirmDelete(false)}
						className="text-sm text-muted-foreground hover:text-foreground"
					>
						Cancel
					</button>
				)}
			</div>

			{/* Track list */}
			<div className="px-8 pb-8">
				{data.tracks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground/50">
						<ListMusic className="w-10 h-10" strokeWidth={1} />
						<p className="text-sm">No tracks yet</p>
						<p className="text-xs">Add tracks from album or playlist pages</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-[2rem_1fr_auto_2rem] items-center border-b border-border/50 pb-2 mb-1 text-xs uppercase tracking-wider text-muted-foreground select-none">
							<span className="text-center">#</span>
							<span className="pl-3">Title</span>
							<span>Duration</span>
							<span />
						</div>

						{data.tracks.map((entry, i) => {
							const isCurrentTrack = entry.trackId === currentSongId;
							return (
								<div
									key={entry.id}
									className={cn(
										"grid grid-cols-[2rem_1fr_auto_2rem] items-center py-2.5 rounded-md transition-colors group",
										"hover:bg-white/5",
										isCurrentTrack && "text-primary",
									)}
								>
									{/* Number / play / pause */}
									<button
										type="button"
										onClick={() => {
											if (isCurrentTrack && isPlaying) pause();
											else handlePlay(i);
										}}
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
										onClick={() => { if (isCurrentTrack && isPlaying) pause(); else handlePlay(i); }}
										className="pl-3 min-w-0 flex flex-col text-left"
									>
										<span className={cn("text-sm font-medium truncate", isCurrentTrack ? "text-primary" : "text-foreground")}>
											{entry.trackMetadata.name}
										</span>
										<span className="text-xs text-muted-foreground truncate">
											{entry.trackMetadata.artists.join(", ")} · {entry.trackMetadata.albumName}
										</span>
									</button>

									{/* Duration */}
									<span className="text-xs text-muted-foreground tabular-nums">
										{formatTime(entry.trackMetadata.durationMs)}
									</span>

									{/* Remove */}
									<button
										type="button"
										onClick={() => removeTrack.mutate({ playlistId: id, entryId: entry.id })}
										className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-red-400"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
							);
						})}
					</>
				)}
			</div>
		</div>
	);
}

function PlaylistSkeleton() {
	return (
		<div className="flex flex-col gap-6 px-8 py-10 animate-pulse">
			<div className="flex items-end gap-6">
				<div className="w-40 h-40 rounded-xl bg-white/5 flex-shrink-0" />
				<div className="flex flex-col gap-3 pb-2">
					<div className="h-3 w-16 bg-white/10 rounded" />
					<div className="h-8 w-48 bg-white/10 rounded" />
					<div className="h-3 w-24 bg-white/10 rounded" />
				</div>
			</div>
			<div className="flex flex-col gap-2 mt-4">
				{Array.from({ length: 6 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
					<div key={i} className="h-10 bg-white/5 rounded-md" />
				))}
			</div>
		</div>
	);
}
