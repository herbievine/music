"use client";

import Image from "next/image";
import { type RefObject, useEffect, useRef, useState } from "react";
import BinIcon from "@/assets/bin-icon";
import ChevronIcon from "@/assets/chevron-icon";
import PauseIcon from "@/assets/pause-icon";
import PlayIcon from "@/assets/play-icon";
import PlaylistIcon from "@/assets/playlist-icon";
import SkipIcon from "@/assets/skip-icon";
import cn from "@/lib/cn";
import formatDuration from "@/lib/formatDuration";
import { useQueueStore } from "@/store/queue";
import MediaViewer from "./media-viewer";

export default function Player() {
	const [expanded, setExpanded] = useState(false);
	const [isQueueOpen, setIsQueueOpen] = useState(false);
	const [progress, setProgress] = useState(0);
	// const [volume, setVolume] = useState(60);
	const { songs, songIndex, isPlaying, pause, remove } = useQueueStore();
	const audioRef = useRef<HTMLAudioElement>(null);
	const progressRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isPlaying) {
			audioRef.current?.play();
		} else {
			audioRef.current?.pause();
		}
	}, [isPlaying, audioRef]);

	useEffect(() => {
		pause();
	}, [pause]);

	if (!songs[songIndex]) {
		return null;
	}

	return (
		<div className="w-full max-w-xl mx-auto flex space-between fixed border-t border-neutral-800 bg-neutral-900 bottom-0 rounded-t-lg">
			<div
				className={cn(
					"w-full px-6 flex justify-between",
					expanded ? "flex-col py-8 space-y-6" : "py-2",
				)}
			>
				{expanded && (
					<button
						className="w-full flex justify-center"
						onClick={() => {
							setExpanded(false);
							setIsQueueOpen(false);
						}}
					>
						<ChevronIcon className="w-6 fill-white" />
					</button>
				)}
				{expanded && !isQueueOpen ? (
					<div className="w-full flex items-center flex-col space-y-6">
						<Image
							src={songs[songIndex].coverLinkHigh}
							alt={`${songs[songIndex].title} by ${songs[songIndex].artist}`}
							width={200}
							height={200}
							className="rounded-lg"
						/>
						<div className="w-full flex flex-col items-start">
							<p className="font-semibold">{songs[songIndex].title}</p>
							<p className="text-sm font-semibold text-neutral-500">
								{songs[songIndex].artist}
							</p>
						</div>
					</div>
				) : (
					<MediaViewer
						media={songs[songIndex]}
						className="w-full"
						onClick={() => {
							if (!expanded) {
								setExpanded(true);
							}
						}}
					/>
				)}
				{isQueueOpen && (
					<div className="w-full flex flex-col space-y-2">
						<p className="font-bold border-b border-neutral-800 pb-2">Queue</p>
						<div className="flex flex-col space-y-2 h-48 overflow-scroll">
							{songs.slice(songIndex + 1).map((song) => (
								<div
									key={song.id}
									className="flex items-center justify-between"
								>
									<MediaViewer media={song} />
									<button
										className="rounded-full bg-neutral-800 w-8 h-8 flex justify-center items-center"
										onClick={() => {
											remove(song);
										}}
									>
										<BinIcon className="fill-white" />
									</button>
								</div>
							))}
						</div>
					</div>
				)}
				{expanded && (
					<PlayerProgress
						progress={progress}
						audioRef={audioRef}
						progressRef={progressRef}
					/>
				)}
				<PlayerControls expanded={expanded} setProgress={setProgress} />
				{expanded && (
					<div className="flex items-center space-x-6 w-full justify-evenly">
						<button
							className={cn(
								isQueueOpen ? "bg-neutral-800 p-2 rounded-lg" : "p-2",
							)}
							onClick={() => {
								setIsQueueOpen(!isQueueOpen);
							}}
						>
							<PlaylistIcon className="fill-white" />
						</button>
					</div>
				)}
				<RawPlayer
					audioRef={audioRef}
					progressRef={progressRef}
					setProgress={setProgress}
				/>
			</div>
		</div>
	);
}

type PlayerControlsProps = {
	expanded: boolean;
	setProgress: (progress: number) => void;
};

function PlayerControls({ expanded, setProgress }: PlayerControlsProps) {
	const { isPlaying, play, pause, next, previous } = useQueueStore();

	return (
		<div
			className={cn(
				"flex items-center space-x-6",
				expanded && "w-full justify-evenly",
			)}
		>
			<button
				onClick={() => {
					setProgress(0);
					previous();
					play();
				}}
			>
				<SkipIcon
					className={cn("fill-white rotate-180", expanded ? "h-8" : "h-5")}
				/>
			</button>
			<button
				onClick={() => {
					if (isPlaying) {
						pause();
					} else {
						play();
					}
				}}
			>
				{isPlaying ? (
					<PauseIcon className={cn("fill-white", expanded ? "h-8" : "h-5")} />
				) : (
					<PlayIcon className={cn("fill-white", expanded ? "h-8" : "h-5")} />
				)}
			</button>
			<button
				onClick={() => {
					setProgress(0);
					next();
					play();
				}}
			>
				<SkipIcon className={cn("fill-white", expanded ? "h-8" : "h-5")} />
			</button>
		</div>
	);
}

type PlayerProgressProps = {
	progress: number;
	audioRef: RefObject<HTMLAudioElement>;
	progressRef: RefObject<HTMLInputElement>;
};

function PlayerProgress({
	progress,
	audioRef,
	progressRef,
}: PlayerProgressProps) {
	const { songs, songIndex } = useQueueStore();

	return (
		<div className="w-full flex flex-col items-center space-y-1">
			<input
				className="w-full h-2 bg-neutral-800 rounded-lg"
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
					{formatDuration(progress * 1000)}
				</span>
				<span className="text-neutral-500 font-bold text-xs">
					{formatDuration(songs[songIndex]?.duration)}
				</span>
			</div>
		</div>
	);
}

type RawPlayerProps = {
	audioRef: RefObject<HTMLAudioElement>;
	progressRef: RefObject<HTMLInputElement>;
	setProgress: (progress: number) => void;
};

export function RawPlayer({
	audioRef,
	progressRef,
	setProgress,
}: RawPlayerProps) {
	const { songs, songIndex, next } = useQueueStore();

	return (
		<audio
			src={songs[songIndex].audioLink}
			ref={audioRef}
			onEnded={next}
			onTimeUpdate={() => {
				if (!audioRef.current || !progressRef.current) return;

				const currentTime = audioRef.current.currentTime;
				const seconds = audioRef.current.duration;

				setProgress(currentTime);
				progressRef.current.value = currentTime.toString();
				progressRef.current.max = seconds.toString();
			}}
			onLoadedMetadata={() => {
				audioRef.current?.play();
			}}
		/>
	);
}
