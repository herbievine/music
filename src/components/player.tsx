"use client";

import PauseIcon from "@/assets/pause-icon";
import PlayIcon from "@/assets/play-icon";
import SkipIcon from "@/assets/skip-icon";
import trackTime from "@/lib/trackTime";
import { useQueueStore } from "@/store/queue";
import Image from "next/image";
import { RefObject, useEffect, useRef } from "react";

export default function Player() {
  const { songs, songIndex, pause } = useQueueStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  // const progressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pause();
  }, [pause]);

  if (!songs[songIndex]) {
    return null;
  }

  return (
    <div className="w-full flex space-between absolute bg-neutral-950 bottom-0 left-0">
      <audio
        className="w-full"
        src={songs[songIndex].audioLink}
        ref={audioRef}
      />
      <div className="w-full px-6 flex border-t border-neutral-800 justify-between py-2">
        <div className={"w-full flex items-center space-x-2"}>
          <Image
            src={songs[songIndex].coverLink}
            alt={`${songs[songIndex].title} by ${songs[songIndex].artist}`}
            width={45}
            height={45}
            className="rounded-lg"
          />
          <div className="flex flex-col">
            <p className="font-semibold">{songs[songIndex].title}</p>
            <p className="text-sm font-semibold text-neutral-500">
              {songs[songIndex].artist}
            </p>
          </div>
        </div>
        {/* <PlayerProgress audioRef={audioRef} progressRef={progressRef} /> */}
        <PlayerControls audioRef={audioRef} />
      </div>
    </div>
  );
}

type PlayerControlsProps = {
  audioRef: RefObject<HTMLAudioElement>;
};

function PlayerControls({ audioRef }: PlayerControlsProps) {
  const { isPlaying, play, pause, next, previous } = useQueueStore();

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, audioRef]);

  return (
    <div className="flex items-center space-x-6">
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
  audioRef: RefObject<HTMLAudioElement>;
  progressRef: RefObject<HTMLInputElement>;
};

function PlayerProgress({ audioRef, progressRef }: PlayerProgressProps) {
  const { songs, songIndex } = useQueueStore();

  return (
    <div className="w-full flex flex-col items-center space-y-2">
      <input
        className="w-full progress"
        type="range"
        ref={progressRef}
        defaultValue="0"
        onChange={(e) => {
          if (!audioRef.current || !progressRef.current) return;
          audioRef.current.currentTime = +progressRef.current.value;
        }}
      />
      <div className="w-full flex items-center justify-between">
        <span className="text-neutral-500">
          {trackTime(audioRef.current?.currentTime ?? 0)}
        </span>
        <span className="text-neutral-500">
          {trackTime(songs[songIndex]?.duration)}
        </span>
      </div>
    </div>
  );
}
