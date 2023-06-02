"use client";

import DownloadIcon from "@/assets/download-icon";
import { Song } from "@/schemas/song";

type DownloadSongButtonProps = {
  song: Song;
};

export default function DownloadSongButton({ song }: DownloadSongButtonProps) {
  return (
    <button className="rounded-lg w-full py-3 bg-neutral-800 flex space-x-2 justify-center items-center">
      <DownloadIcon className="w-3.5 h-3.5 fill-blue-400" />
      <span className="font-bold text-blue-400">Download</span>
    </button>
  );
}
