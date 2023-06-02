"use client";

import PlayIcon from "@/assets/play-icon";
import { Song } from "@/schemas/song";

type PlayButtonProps = {
  song: Song;
};

export default function PlayButton({ song }: PlayButtonProps) {
  return (
    <button className="rounded-lg w-full py-3 bg-neutral-800 flex space-x-2 justify-center items-center">
      <PlayIcon className="w-3.5 h-3.5 fill-blue-400" />
      <span className="font-bold text-blue-400">Play</span>
    </button>
  );
}
