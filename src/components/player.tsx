"use client";

import ChevronIcon from "@/assets/chevron-icon";
import PauseIcon from "@/assets/pause-icon";
import PlayIcon from "@/assets/play-icon";
import RoundArrowLeftIcon from "@/assets/round-arrow-left-icon";
import RoundArrowRightIcon from "@/assets/round-arrow-right-icon";
import SkipIcon from "@/assets/skip-icon";
import cn from "@/lib/cn";
import formatDuration from "@/lib/formatDuration";
import { useQueueStore } from "@/store/queue";
import Image from "next/image";
import { RefObject, useEffect, useRef, useState } from "react";

export default function Player() {
  const [expanded, setExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const { songs, songIndex, isPlaying, pause } = useQueueStore();
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
    <div className="w-full max-w-xl mx-auto flex space-between fixed bg-neutral-950 bottom-0">
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
        <PlayerControls expanded={expanded} audioRef={audioRef} />
        {expanded && (
          <PlayerProgress
            progress={progress}
            audioRef={audioRef}
            progressRef={progressRef}
          />
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
  audioRef: RefObject<HTMLAudioElement>;
};

function PlayerControls({ expanded, audioRef }: PlayerControlsProps) {
  const { isPlaying, play, pause, next, previous } = useQueueStore();

  return (
    <div
      className={cn(
        "flex items-center space-x-6",
        expanded && "w-full justify-center"
      )}
    >
      {expanded && (
        <button
          onClick={() => {
            if (!audioRef.current) return;

            audioRef.current.currentTime -= 10;
          }}
        >
          <RoundArrowLeftIcon className="h-5 fill-white" />
        </button>
      )}
      <button
        onClick={() => {
          previous();
          play();
        }}
      >
        <SkipIcon className="h-5 fill-white rotate-180" />
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
          <PauseIcon className="h-5 fill-white" />
        ) : (
          <PlayIcon className="h-5 fill-white" />
        )}
      </button>
      <button
        onClick={() => {
          next();
          play();
        }}
      >
        <SkipIcon className="h-5 fill-white" />
      </button>
      {expanded && (
        <button
          onClick={() => {
            if (!audioRef.current) return;

            audioRef.current.currentTime += 10;
          }}
        >
          <RoundArrowRightIcon className="h-5 fill-white" />
        </button>
      )}
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
    />
  );
}
