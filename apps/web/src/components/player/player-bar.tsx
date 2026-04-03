import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMediaSession } from "../../hooks/use-media-session";
import { client } from "../../lib/hono-rpc";
import { useQueueStore } from "../../store/queue";
import { AudioTag } from "./audio";

function formatTime(seconds: number): string {
	if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
	const { session } = useClerk();
	const [progress, setProgress] = useState(0);
	const [volume, setVolume] = useState(1);
	const { songs, songIndex, isPlaying, play, pause, next, previous } =
		useQueueStore();
	const audioRef = useRef<HTMLAudioElement>(null);
	const progressRef = useRef<HTMLInputElement>(null);

	const { data } = useQuery({
		queryKey: ["play", songs[songIndex]],
		queryFn: async () => {
			const res = await client.play[":spotifyId"].$get(
				{
					param: {
						spotifyId: songs[songIndex].id,
					},
					...(songs[songIndex + 1]
						? {
								query: {
									next: songs[songIndex + 1].id,
								},
							}
						: {}),
				},
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error(`cannot play ${songs[songIndex]}`);
			}

			return res.json();
		},
		enabled: songIndex !== -1,
	});

	useMediaSession({ audioRef });

	// Sync store with audio ref
	useEffect(() => {
		if (songIndex !== -1 && isPlaying) {
			audioRef.current?.play();
		}
		if (songIndex === -1 || !isPlaying) {
			audioRef.current?.pause();
		}
	}, [songIndex, isPlaying]);

	// Trigger play after song link is loaded
	useEffect(() => {
		if (isPlaying && data) {
			audioRef.current?.play();
		}
	}, [data, isPlaying]);

	// Sync volume
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
		}
	}, [volume]);

	if (songs.length === 0) return null;

	const currentSong = songs[songIndex];
	if (!currentSong) return null;

	const duration = audioRef.current?.duration ?? 0;

	return (
		<div className="h-20 bg-zinc-900 border-t border-zinc-800 fixed bottom-0 left-0 right-0 z-50">
			<div className="grid grid-cols-3 items-center h-full px-4">
				{/* Left: track info */}
				<div className="flex items-center gap-3">
					<img
						src={currentSong.album.image}
						alt={currentSong.album.name}
						className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
					/>
					<div className="min-w-0">
						<p className="text-sm font-medium truncate max-w-[160px]">
							{currentSong.name}
						</p>
						<p className="text-xs text-zinc-400 truncate max-w-[160px]">
							{currentSong.artists[0]?.name}
						</p>
					</div>
				</div>

				{/* Center: controls + progress */}
				<div className="flex flex-col items-center gap-1">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={previous}
							className="text-zinc-400 hover:text-white transition-colors"
						>
							<SkipBack className="w-5 h-5" />
						</button>
						<button
							type="button"
							onClick={() => (isPlaying ? pause() : play())}
							className="text-white hover:text-zinc-200 transition-colors"
						>
							{isPlaying ? (
								<Pause className="w-8 h-8" />
							) : (
								<Play className="w-8 h-8" />
							)}
						</button>
						<button
							type="button"
							onClick={next}
							className="text-zinc-400 hover:text-white transition-colors"
						>
							<SkipForward className="w-5 h-5" />
						</button>
					</div>
					<div className="flex items-center gap-2 w-full max-w-sm">
						<span className="text-xs text-zinc-500 w-8 text-right">
							{formatTime(progress)}
						</span>
						<input
							ref={progressRef}
							type="range"
							min={0}
							max={duration || 100}
							step={0.1}
							value={progress}
							onChange={(e) => {
								const val = parseFloat(e.target.value);
								setProgress(val);
								if (audioRef.current) {
									audioRef.current.currentTime = val;
								}
							}}
							className="flex-1 h-1 accent-white cursor-pointer"
						/>
						<span className="text-xs text-zinc-500 w-8">
							{formatTime(duration)}
						</span>
					</div>
				</div>

				{/* Right: volume */}
				<div className="flex items-center justify-end gap-2">
					<Volume2 className="w-4 h-4 text-zinc-400" />
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						value={volume}
						onChange={(e) => setVolume(parseFloat(e.target.value))}
						className="w-24 h-1 accent-white cursor-pointer"
					/>
				</div>
			</div>

			<AudioTag
				src={data?.url}
				audioRef={audioRef}
				progressRef={progressRef}
				setProgress={setProgress}
			/>
		</div>
	);
}
