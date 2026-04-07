import { Link } from "@tanstack/react-router";
import { ListX, Pause, Play, Shuffle, SkipBackIcon, SkipForward } from "lucide-react";
import type { RefObject } from "react";
import { useState } from "react";
import { formatTime } from "../../lib/format-time";
import { useLyrics } from "../../api/lyrics";
import { LyricsView } from "../lyrics-view";
import { useQueueStore } from "../../store/queue";

type Props = {
	playerRef: RefObject<HTMLDivElement>;
	audioRef: RefObject<HTMLAudioElement>;
	progressRef: RefObject<HTMLInputElement>;
	progress: number;
};

export function PlayerExpandedView({
	playerRef,
	audioRef,
	progressRef,
	progress,
}: Props) {
	const { songs, songIndex, play, pause, next, previous, isPlaying, skipTo, isShuffle, toggleShuffle } =
		useQueueStore();
	const [tab, setTab] = useState<"lyrics" | "queue">("lyrics");

	const currentSong = songs[songIndex];
	const { data: lyricsData, isLoading: lyricsLoading } = useLyrics(
		currentSong.id,
		currentSong.name,
		currentSong.artists[0].name,
		currentSong.durationMs,
	);

	if (songIndex === -1) {
		return null;
	}

	return (
		<div
			ref={playerRef}
			className="w-full h-full flex flex-col items-center space-y-4"
		>
			<div className="w-full flex space-x-4 items-center">
				<img
					src={songs[songIndex].album.image}
					alt={`${songs[songIndex].album.name} cover`}
					className="h-20 rounded-lg"
				/>
				<div className="w-full flex flex-col items-start">
					<span className="font-semibold">{songs[songIndex].name}</span>
					<Link
						to="/album/$id"
						params={{ id: songs[songIndex].album.id }}
						className="underline text-sm text-neutral-500"
					>
						{songs[songIndex].album.name}
					</Link>
					<span className="text-sm text-neutral-500">
						{songs[songIndex].artists[0].name}
					</span>
				</div>
			</div>

			{/* Tab selector */}
			<div className="w-full flex gap-2 border-b border-neutral-700">
				<button
					onClick={() => setTab("lyrics")}
					className={`flex-1 py-2 text-sm font-medium transition-colors ${
						tab === "lyrics"
							? "text-white border-b-2 border-white -mb-px"
							: "text-neutral-500"
					}`}
				>
					Lyrics
				</button>
				<button
					onClick={() => setTab("queue")}
					className={`flex-1 py-2 text-sm font-medium transition-colors ${
						tab === "queue"
							? "text-white border-b-2 border-white -mb-px"
							: "text-neutral-500"
					}`}
				>
					Queue
				</button>
			</div>

			{tab === "lyrics" ? (
				<div className="w-full h-full flex flex-col">
					<LyricsView
						plain={lyricsData?.plain ?? null}
						synced={lyricsData?.synced ?? null}
						progress={progress}
						isLoading={lyricsLoading}
					/>
				</div>
			) : (
				<>
					<p className="w-full text-sm text-left">Next up</p>
					<div className="w-full h-full flex flex-col space-y-4 overflow-y-auto">
						{songs.length - 1 >= songIndex + 1 ? (
							songs.slice(songIndex + 1).map((track) => (
							<button
								key={track.id}
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();

									skipTo(track.id);
								}}
								className="w-full flex space-x-2 items-center"
							>
								<img
									src={track.album.image}
									alt={`${track.album.name} cover`}
									className="h-12 rounded-lg"
								/>
								<div className="w-full flex flex-col items-start">
									<span className="line-clamp-1">{track.name}</span>
									<span className="text-sm line-clamp-1 text-neutral-500">
										{track.album.name} - {track.artists[0].name}
									</span>
								</div>
							</button>
						))
						) : (
							<div className="w-full h-full flex justify-center items-center">
								<ListX strokeWidth={1.5} size={128} className="stroke-zinc-500" />
							</div>
						)}
					</div>
				</>
			)}
			<div className="w-full flex flex-col items-center space-y-8 py-8">
				<div className="w-full flex flex-col items-center space-y-1">
					<input
						className="w-full h-2 bg-zinc-700 accent-zinc-100 rounded-lg appearance-none"
						type="range"
						ref={progressRef}
						defaultValue="0"
						onChange={() => {
							if (!audioRef.current || !progressRef.current) return;
							audioRef.current.currentTime = +progressRef.current.value;
						}}
					/>
					<div className="w-full flex items-center justify-between">
						<span className="text-neutral-500 font-bold text-xs">
							{formatTime(progress * 1000)}
						</span>
						<span className="text-neutral-500 font-bold text-xs">
							-{formatTime(songs[songIndex].durationMs - progress * 1000)}
						</span>
					</div>
				</div>
				<div className="w-full flex justify-evenly items-center">
<button
				type="button"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					toggleShuffle();
				}}
				className={isShuffle ? "text-emerald-400" : "text-neutral-400"}
			>
				<Shuffle strokeWidth={2} size={24} />
			</button>

								<button
						type="button"
						onClick={async (e) => {
							e.preventDefault();
							e.stopPropagation();

							pause();
							audioRef.current?.pause();
							previous();
						}}
					>
						<SkipBackIcon strokeWidth={2} size={32} />
					</button>
					{isPlaying ? (
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();

								pause();
							}}
						>
							<Pause strokeWidth={2} size={40} />
						</button>
					) : (
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();

								pause();
								audioRef.current?.pause();
								play();
							}}
						>
							<Play strokeWidth={2} size={40} />
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
						<SkipForward strokeWidth={2} size={32} />
					</button>
				</div>
			</div>
		</div>
	);
}
