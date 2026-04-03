import { Link } from "@tanstack/react-router";
import { Heart, HeartOff, ListX, Music2 } from "lucide-react";
import { useIsLiked, useLikeMutation } from "../hooks/use-likes";
import { useQueueStore } from "../store/queue";
import cn from "../utils/cn";

export default function QueuePanel() {
	const { songs, songIndex, skipTo } = useQueueStore();

	if (songIndex === -1 || !songs[songIndex]) {
		return (
			<div className="w-[300px] flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col items-center justify-center gap-3 text-zinc-600">
				<Music2 className="w-12 h-12" strokeWidth={1.5} />
				<span className="text-sm">Nothing playing</span>
			</div>
		);
	}

	const currentSong = songs[songIndex];
	const upcoming = songs.slice(songIndex + 1);

	return (
		<div className="w-[300px] flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden">
			{/* Album art */}
			<div className="w-full aspect-square flex-shrink-0 overflow-hidden">
				<img
					src={currentSong.album.image}
					alt={currentSong.album.name}
					className="w-full h-full object-cover"
				/>
			</div>

			{/* Track info + like */}
			<div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
				<div className="min-w-0">
					<p className="font-bold text-base truncate">{currentSong.name}</p>
					<p className="text-sm text-zinc-400 truncate">
						{currentSong.artists[0]?.name}
					</p>
					<Link
						to="/album/$id"
						params={{ id: currentSong.album.id }}
						className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors truncate block"
					>
						{currentSong.album.name}
					</Link>
				</div>
				<LikeButton songId={currentSong.id} song={currentSong} />
			</div>

			<div className="border-t border-zinc-800 mx-4" />

			{/* Queue */}
			<p className="text-xs uppercase tracking-wider text-zinc-500 px-4 pt-4 pb-2">
				Next up
			</p>
			<div className="flex-1 overflow-y-auto pb-4">
				{upcoming.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-700">
						<ListX className="w-10 h-10" strokeWidth={1.5} />
						<span className="text-xs">Queue empty</span>
					</div>
				) : (
					upcoming.map((track) => (
						<button
							key={track.id}
							type="button"
							onClick={() => skipTo(track.id)}
							className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-left"
						>
							<img
								src={track.album.image}
								alt={track.album.name}
								className="w-9 h-9 rounded-md object-cover flex-shrink-0"
							/>
							<div className="min-w-0">
								<p className="text-sm font-medium truncate">{track.name}</p>
								<p className="text-xs text-zinc-500 truncate">
									{track.artists[0]?.name}
								</p>
							</div>
						</button>
					))
				)}
			</div>
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
				"flex-shrink-0 p-1.5 rounded-full transition-colors",
				isLiked
					? "text-green-400 hover:text-green-300"
					: "text-zinc-500 hover:text-white",
			)}
		>
			{isLiked ? (
				<HeartOff className="w-5 h-5" />
			) : (
				<Heart className="w-5 h-5" />
			)}
		</button>
	);
}
