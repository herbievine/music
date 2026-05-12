import { Heart, HeartOff, Pause, Play, Shuffle, SkipBack, SkipForward, Volume2, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAudioContext } from "../../contexts/audio-context";
import { useAlbumColor } from "../../hooks/use-album-color";
import { useQueueStore } from "../../store/queue";
import { useIsLiked, useLikeMutation } from "../../hooks/use-likes";
import { Slider } from "@/components/ui/slider";
import { FixYoutubeDialog } from "../fix-youtube-dialog";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
	if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
	const [volume, setVolume] = useState(1);
	const [fixYoutubeOpen, setFixYoutubeOpen] = useState(false);
	const { songs, songIndex, isPlaying, play, pause, next, previous, isShuffle, toggleShuffle } =
		useQueueStore();
	const { audioRef, progressRef, progress, setProgress } = useAudioContext();

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
		}
	}, [volume, audioRef]);

	const currentSong = songs[songIndex];
	const duration = currentSong ? currentSong.durationMs / 1000 : 0;
	const albumColor = useAlbumColor(currentSong?.album.image);
	const barStyle = useMemo(() => {
		if (!albumColor) return undefined;
		const [r, g, b] = albumColor;
		return {
			backgroundImage: `linear-gradient(to right, rgba(${r},${g},${b},0.15), rgba(${r},${g},${b},0.05) 50%, rgba(${r},${g},${b},0.15))`,
		} as React.CSSProperties;
	}, [albumColor]);

	if (songs.length === 0 || !currentSong) return null;

	return (
		<>
			<div className="h-[72px] flex-shrink-0 bg-background border-t border-border/50 px-4 transition-all duration-700" style={barStyle}>
				<div className="grid grid-cols-3 items-center h-full max-w-screen-2xl mx-auto gap-4">

					{/* Left: track info + like */}
					<div className="flex items-center gap-3 min-w-0">
						<img
							src={currentSong.album.image}
							alt={currentSong.album.name}
							className="w-[52px] h-[52px] rounded-md object-cover flex-shrink-0"
						/>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium truncate leading-tight">
								{currentSong.name}
							</p>
							<p className="text-xs text-foreground truncate mt-0.5">
								{currentSong.artists[0] ? (
								<Link
									to="/artist/$id"
									params={{ id: currentSong.artists[0].id }}
									className="hover:text-white transition-colors"
								>
									{currentSong.artists[0].name}
								</Link>
							) : null}
							</p>
						</div>
						<LikeButton songId={currentSong.id} song={currentSong} />
					</div>

					{/* Center: controls + progress */}
					<div className="flex flex-col items-center gap-1.5">
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={toggleShuffle}
								className={cn(
									"transition-colors p-1",
									isShuffle ? "text-emerald-400 hover:text-emerald-300" : "text-muted-foreground hover:text-foreground",
								)}
							>
								<Shuffle className="w-4 h-4" />
							</button>

							<button
								type="button"
								onClick={previous}
								className="text-muted-foreground hover:text-foreground transition-colors p-1"
							>
								<SkipBack className="w-4 h-4 fill-current" />
							</button>

							<button
								type="button"
								onClick={() => (isPlaying ? pause() : play())}
								className="w-8 h-8 bg-white hover:scale-105 active:scale-100 rounded-full flex items-center justify-center transition-transform flex-shrink-0 shadow"
							>
								{isPlaying ? (
									<Pause className="w-4 h-4 text-black fill-black" />
								) : (
									<Play className="w-4 h-4 text-black fill-black ml-0.5" />
								)}
							</button>

							<button
								type="button"
								onClick={next}
								className="text-muted-foreground hover:text-foreground transition-colors p-1"
							>
								<SkipForward className="w-4 h-4 fill-current" />
							</button>
						</div>

						{/* Progress */}
						<div className="flex items-center gap-2 w-full max-w-md">
							<span className="text-[10px] text-muted-foreground w-7 text-right tabular-nums">
								{formatTime(progress)}
							</span>
							<Slider
								min={0}
								max={duration || 100}
								step={0.1}
								value={[progress]}
								onValueChange={([val]) => {
									setProgress(val);
									if (audioRef.current) audioRef.current.currentTime = val;
								}}
								className="flex-1"
							/>
							<input ref={progressRef} type="range" className="hidden" readOnly />
							<span className="text-[10px] text-muted-foreground w-7 tabular-nums">
								{formatTime(duration)}
							</span>
						</div>
					</div>

					{/* Right: volume + fix youtube */}
					<div className="flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={() => setFixYoutubeOpen(true)}
							title="Fix YouTube URL"
							className="text-muted-foreground hover:text-foreground transition-colors p-1"
						>
							<Wrench className="w-4 h-4" />
						</button>
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

			<FixYoutubeDialog
				open={fixYoutubeOpen}
				onOpenChange={setFixYoutubeOpen}
				spotifyId={currentSong.id}
				songName={currentSong.name}
			/>
		</>
	);
}

function LikeButton({
	songId,
	song,
}: {
	songId: string;
	song: { name: string; album: { image: string; id: string }; artists: { name: string }[] };
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
				"flex-shrink-0 p-1 transition-colors",
				isLiked ? "text-emerald-400 hover:text-emerald-300" : "text-muted-foreground hover:text-foreground",
			)}
		>
			{isLiked ? <HeartOff className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
		</button>
	);
}
