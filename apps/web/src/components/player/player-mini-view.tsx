import { Pause, Play, SkipForward } from "lucide-react";
import { useQueueStore } from "../../store/queue";

export function PlayerMiniView() {
	const { songs, songIndex, play, pause, next, isPlaying } = useQueueStore();

	if (songIndex === -1) {
		return null;
	}

	return (
		<div className="w-full h-full flex justify-between items-center">
			<div className="flex space-x-2 items-center">
				<img
					src={songs[songIndex].album.image}
					alt={`${songs[songIndex].album.name} cover`}
					className="h-10 rounded-lg"
				/>
				<div className="w-full flex flex-col items-start">
					<span className="line-clamp-1">{songs[songIndex].name}</span>
					<p className="text-sm text-neutral-500 line-clamp-1">
						{songs[songIndex].artists[0].name}
					</p>
				</div>
			</div>
			<div className="px-2 flex space-x-3 items-center">
				{isPlaying ? (
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							pause();
						}}
					>
						<Pause strokeWidth={1.75} size={24} />
					</button>
				) : (
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							play();
						}}
					>
						<Play strokeWidth={2} size={22} />
					</button>
				)}
				<button
					type="button"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();

						next();
					}}
				>
					<SkipForward strokeWidth={2} size={24} />
				</button>
			</div>
		</div>
	);
}
