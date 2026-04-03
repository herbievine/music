import { Link } from "@tanstack/react-router";
import { Heart, HeartOff, ListX, Music2 } from "lucide-react";
import { useIsLiked, useLikeMutation } from "../hooks/use-likes";
import { useQueueStore } from "../store/queue";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function QueuePanel() {
	const { songs, songIndex, skipTo } = useQueueStore();

	if (songIndex === -1 || !songs[songIndex]) {
		return (
			<div className="w-72 flex-shrink-0 rounded-xl bg-card flex flex-col items-center justify-center gap-3">
				<Music2 className="w-10 h-10 text-muted-foreground/30" strokeWidth={1.5} />
				<span className="text-sm text-muted-foreground/60">Nothing playing</span>
			</div>
		);
	}

	const currentSong = songs[songIndex];
	const upcoming = songs.slice(songIndex + 1);

	return (
		<div className="w-72 flex-shrink-0 rounded-xl bg-card flex flex-col overflow-hidden">
			{/* Album art — square */}
			<div className="w-full aspect-square flex-shrink-0 overflow-hidden rounded-t-xl relative">
				<img
					src={currentSong.album.image}
					alt={currentSong.album.name}
					className="w-full h-full object-cover"
				/>
			</div>

			{/* Track info + like */}
			<div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-sm truncate leading-tight">
						{currentSong.name}
					</p>
					<p className="text-xs text-muted-foreground truncate mt-0.5">
						{currentSong.artists[0]?.name}
					</p>
					<Link
						to="/album/$id"
						params={{ id: currentSong.album.id }}
						className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors truncate block mt-0.5"
					>
						{currentSong.album.name}
					</Link>
				</div>
				<LikeButton songId={currentSong.id} song={currentSong} />
			</div>

			{/* Next up */}
			<div className="border-t border-border/50 mx-4" />
			<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-4 pt-3 pb-1">
				Next up
			</p>

			<ScrollArea className="flex-1 pb-3">
				{upcoming.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-6 gap-2">
						<ListX className="w-7 h-7 text-muted-foreground/30" strokeWidth={1.5} />
						<span className="text-xs text-muted-foreground/50">Queue empty</span>
					</div>
				) : (
					<div className="px-2 pb-2">
						{upcoming.map((track) => (
							<button
								key={track.id}
								type="button"
								onClick={() => skipTo(track.id)}
								className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left group"
							>
								<img
									src={track.album.image}
									alt={track.album.name}
									className="w-9 h-9 rounded-md object-cover flex-shrink-0"
								/>
								<div className="min-w-0">
									<p className="text-xs font-medium truncate group-hover:text-foreground transition-colors">
										{track.name}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{track.artists[0]?.name}
									</p>
								</div>
							</button>
						))}
					</div>
				)}
			</ScrollArea>
		</div>
	);
}

function LikeButton({
	songId,
	song,
}: {
	songId: string;
	song: { name: string; album: { image: string }; artists: { name: string }[] };
}) {
	const { isLiked, likeEntry } = useIsLiked(songId, "track");
	const { like, unlike } = useLikeMutation();

	return (
		<button
			type="button"
			onClick={() => {
				if (isLiked && likeEntry) {
					unlike.mutate(likeEntry.id);
				} else {
					like.mutate({
						itemId: songId,
						itemType: "track",
						metadata: {
							name: song.name,
							image: song.album.image,
							artist: song.artists[0]?.name ?? "",
						},
					});
				}
			}}
			className={cn(
				"flex-shrink-0 p-1 transition-colors mt-0.5",
				isLiked ? "text-green-400 hover:text-green-300" : "text-muted-foreground/50 hover:text-foreground",
			)}
		>
			{isLiked ? <HeartOff className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
		</button>
	);
}
