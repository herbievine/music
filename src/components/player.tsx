"use client";

import ChevronIcon from "@/assets/chevron-icon";
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
  const playAnimationRef = useRef<number>();

  const repeat = useCallback(() => {
    if (!audioRef.current || !progressRef.current) return;

    console.log("repeat", audioRef.current.currentTime);

    const currentTime = audioRef.current.currentTime;
    setProgress(currentTime);
    progressRef.current.value = currentTime.toString();
    progressRef.current.style.setProperty(
      "--range-progress",
      `${(+progressRef.current.value / audioRef.current.duration) * 100}%`
    );

    playAnimationRef.current = requestAnimationFrame(repeat);
  }, [audioRef, progressRef, setProgress]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }

    console.log("isPlaying", isPlaying);
    console.log("audioRef.current?.paused", audioRef.current?.paused);
    console.log("audioRef.current", audioRef.current);
    console.log("progressRef.current", progressRef.current);
    console.log("playAnimationRef.current", playAnimationRef.current);

    playAnimationRef.current = requestAnimationFrame(repeat);
  }, [isPlaying, audioRef, repeat, progressRef, playAnimationRef]);

  useEffect(() => {
    if (!audioRef.current || !progressRef.current) return;

    const seconds = audioRef.current.duration;
    progressRef.current.max = seconds.toString();
  }, [audioRef, progressRef]);

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
    <div className="w-full max-w-xl mx-auto flex space-between fixed bg-neutral-950 bottom-0">
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
        {expanded && (
          <div className="w-full flex justify-center">
            <button
              className="w-min"
              onClick={() => {
                setExpanded(false);
              }}
            >
              <ChevronIcon className="w-6 fill-white" />
            </button>
          </div>
        )}
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
        {/* {expanded && (
          <PlayerProgress
            progress={progress}
            audioRef={audioRef}
            progressRef={progressRef}
          />
        )} */}
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
        <span className="text-neutral-500 font-bold text-sm">
          {formatDuration(progress * 1000)}
        </span>
        <span className="text-neutral-500 font-bold text-sm">
          {formatDuration(songs[songIndex]?.duration)}
        </span>
      </div>
    </div>
  );
}
