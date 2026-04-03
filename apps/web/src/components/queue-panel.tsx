import { Link } from "@tanstack/react-router";
import { Heart, HeartOff, ListX, Music2 } from "lucide-react";
import { useIsLiked, useLikeMutation } from "../hooks/use-likes";
import { useQueueStore } from "../store/queue";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function QueuePanel() {
	const { songs, songIndex, skipTo } = useQueueStore();

	if (songIndex === -1 || !songs[songIndex]) {
		return (
			<div className="w-72 flex-shrink-0 rounded-xl bg-card flex flex-col items-center justify-center gap-3 text-muted-foreground/40">
				<Music2 className="w-10 h-10" strokeWidth={1.5} />
				<span className="text-sm text-muted-foreground">Nothing playing</span>
			</div>
		);
	}

	const currentSong = songs[songIndex];
	const upcoming = songs.slice(songIndex + 1);

	return (
		<div className="w-72 flex-shrink-0 rounded-xl bg-card flex flex-col overflow-hidden">
			{/* Album art */}
			<div className="w-full aspect-square flex-shrink-0 overflow-hidden rounded-t-xl">
				<img
					src={currentSong.album.image}
					alt={currentSong.album.name}
					className="w-full h-full object-cover"
				/>
			</div>

			{/* Track info + like */}
			<div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="font-semibold text-sm truncate">{currentSong.name}</p>
					<p className="text-xs text-muted-foreground truncate mt-0.5">
						{currentSong.artists[0]?.name}
					</p>
					<Link
						to="/album/$id"
						params={{ id: currentSong.album.id }}
						className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors truncate block mt-0.5"
					>
						{currentSong.album.name}
					</Link>
				</div>
				<LikeButton songId={currentSong.id} song={currentSong} />
			</div>

			<Separator className="mx-4 w-auto" />

			{/* Queue */}
			<p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-medium px-4 pt-3 pb-2">
				Next up
			</p>
			<ScrollArea className="flex-1 pb-4">
				{upcoming.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground/40">
						<ListX className="w-8 h-8" strokeWidth={1.5} />
						<span className="text-xs">Queue empty</span>
					</div>
				) : (
					<div className="px-2">
						{upcoming.map((track) => (
							<button
								key={track.id}
								type="button"
								onClick={() => skipTo(track.id)}
								className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
							>
								<img
									src={track.album.image}
									alt={track.album.name}
									className="w-8 h-8 rounded-md object-cover flex-shrink-0"
								/>
								<div className="min-w-0">
									<p className="text-xs font-medium truncate">{track.name}</p>
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
		<Button
			variant="ghost"
			size="icon-sm"
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
				"flex-shrink-0 transition-colors",
				isLiked ? "text-green-400 hover:text-green-300" : "text-muted-foreground",
			)}
		>
			{isLiked ? (
				<HeartOff className="w-4 h-4" />
			) : (
				<Heart className="w-4 h-4" />
			)}
		</Button>
	);
}
