import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAudioContext } from "../../contexts/audio-context";
import { useQueueStore } from "../../store/queue";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
	if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
	const [volume, setVolume] = useState(1);
	const { songs, songIndex, isPlaying, play, pause, next, previous } =
		useQueueStore();
	const { audioRef, progressRef, progress, setProgress } = useAudioContext();

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
		}
	}, [volume, audioRef]);

	if (songs.length === 0) return null;

	const currentSong = songs[songIndex];
	if (!currentSong) return null;

	const duration = audioRef.current?.duration ?? 0;

	return (
		<div className="h-20 flex-shrink-0 bg-background border-t border-border px-4">
			<div className="grid grid-cols-3 items-center h-full max-w-screen-2xl mx-auto">
				{/* Left: track info */}
				<div className="flex items-center gap-3 min-w-0">
					<img
						src={currentSong.album.image}
						alt={currentSong.album.name}
						className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
					/>
					<div className="min-w-0">
						<p className="text-sm font-medium truncate">{currentSong.name}</p>
						<p className="text-xs text-muted-foreground truncate">
							{currentSong.artists[0]?.name}
						</p>
					</div>
				</div>

				{/* Center: controls + progress */}
				<div className="flex flex-col items-center gap-2">
					<div className="flex items-center gap-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={previous}
									className="text-muted-foreground hover:text-foreground"
								>
									<SkipBack className="w-4 h-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Previous</TooltipContent>
						</Tooltip>

						<Button
							variant="outline"
							size="icon"
							onClick={() => (isPlaying ? pause() : play())}
							className={cn(
								"rounded-full mx-1",
								"text-foreground",
							)}
						>
							{isPlaying ? (
								<Pause className="w-4 h-4" fill="currentColor" />
							) : (
								<Play className="w-4 h-4" fill="currentColor" />
							)}
						</Button>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={next}
									className="text-muted-foreground hover:text-foreground"
								>
									<SkipForward className="w-4 h-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Next</TooltipContent>
						</Tooltip>
					</div>

					<div className="flex items-center gap-2 w-full max-w-sm">
						<span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
							{formatTime(progress)}
						</span>
						<Slider
							min={0}
							max={duration || 100}
							step={0.1}
							value={[progress]}
							onValueChange={([val]) => {
								setProgress(val);
								if (audioRef.current) {
									audioRef.current.currentTime = val;
								}
							}}
							className="flex-1"
						/>
						{/* hidden input for backward compat with AudioTag */}
						<input
							ref={progressRef}
							type="range"
							className="hidden"
							readOnly
						/>
						<span className="text-xs text-muted-foreground w-8 tabular-nums">
							{formatTime(duration)}
						</span>
					</div>
				</div>

				{/* Right: volume */}
				<div className="flex items-center justify-end gap-3">
					<Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
					<Slider
						min={0}
						max={1}
						step={0.01}
						value={[volume]}
						onValueChange={([val]) => setVolume(val)}
						className="w-24"
					/>
				</div>
			</div>
		</div>
	);
}
