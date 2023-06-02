"use client";

import PauseIcon from "@/assets/pause-icon";
import PlayIcon from "@/assets/play-icon";
import SkipIcon from "@/assets/skip-icon";
import cn from "@/lib/cn";
import formatDuration from "@/lib/formatDuration";
import { useQueueStore } from "@/store/queue";
import Image from "next/image";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

export default function Player() {
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const { songs, songIndex, isPlaying, pause, next } = useQueueStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number>();

  const animate = useCallback(() => {
    if (!audioRef.current || !progressRef.current || !animationRef.current)
      return;

    const currentTime = audioRef.current.currentTime;
    setProgress(currentTime);
    progressRef.current.value = currentTime.toString();
    animationRef.current = requestAnimationFrame(animate);
  }, [audioRef, progressRef, setProgress]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, audioRef, animate]);

  useEffect(() => {
    pause();
  }, [pause]);

  if (!songs[songIndex]) {
    return null;
  }

  function onLoadedMetadata() {
    if (!audioRef.current || !progressRef.current) return;

    const seconds = audioRef.current.duration;
    progressRef.current.max = seconds.toString();
  }

  return (
    <div className="w-full flex space-between fixed bg-neutral-950 bottom-0 left-0">
      <audio
        src={songs[songIndex].audioLink}
        ref={audioRef}
        onEnded={next}
        onTimeUpdate={() => {
          if (!audioRef.current || !progressRef.current) return;
          progressRef.current.value = audioRef.current.currentTime.toString();
        }}
        onLoadedMetadata={onLoadedMetadata}
      />
      <div
        className={cn(
          "w-full px-6 flex border-t border-neutral-800 justify-between",
          expanded ? "flex-col py-12 space-y-6" : "py-2"
        )}
      >
        <div
          className={cn(
            "w-full flex items-center",
            expanded ? "flex-col space-y-6" : "space-x-2"
          )}
          onClick={() => {
            if (!expanded) {
              setExpanded(true);
            }
          }}
        >
          <Image
            src={songs[songIndex].coverLink}
            alt={`${songs[songIndex].title} by ${songs[songIndex].artist}`}
            width={expanded ? 250 : 45}
            height={expanded ? 250 : 45}
            className="rounded-lg"
          />
          <div className={cn("flex flex-col", expanded && "items-center")}>
            <p className="font-semibold">{songs[songIndex].title}</p>
            <p className="text-sm font-semibold text-neutral-500">
              {songs[songIndex].artist}
            </p>
          </div>
        </div>
        <PlayerControls expanded={expanded} />
        {expanded && (
          <PlayerProgress
            progress={progress}
            audioRef={audioRef}
            progressRef={progressRef}
          />
        )}
      </div>
    </div>
  );
}

type PlayerControlsProps = {
  expanded: boolean;
};

function PlayerControls({ expanded }: PlayerControlsProps) {
  const { isPlaying, play, pause, next, previous } = useQueueStore();

  return (
    <div
      className={cn(
        "flex items-center space-x-6",
        expanded && "w-full justify-center"
      )}
    >
      <button
        onClick={() => {
          previous();
          play();
        }}
      >
        <SkipIcon className="h-6 fill-white rotate-180" />
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
          <PauseIcon className="h-6 fill-white" />
        ) : (
          <PlayIcon className="h-6 fill-white" />
        )}
      </button>
      <button
        onClick={() => {
          next();
          play();
        }}
      >
        <SkipIcon className="h-6 fill-white" />
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
        className="w-full progress"
        type="range"
        ref={progressRef}
        defaultValue="0"
        onChange={() => {
          if (!audioRef.current || !progressRef.current) return;
          audioRef.current.currentTime = +progressRef.current.value;
        }}
      />
      <div className="w-full flex items-center justify-between">
        <span className="text-neutral-500 text-sm font-bold">
          {formatDuration(progress * 1000)}
        </span>
        <span className="text-neutral-500 text-sm font-bold">
          {formatDuration(songs[songIndex]?.duration)}
        </span>
      </div>
    </div>
  );
}
