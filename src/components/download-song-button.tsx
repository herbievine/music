"use client";

import DownloadIcon from "@/assets/download-icon";
import useConverter from "@/hooks/useConverter";
import { MediaSong } from "@/types/media";

type DownloadSongButtonProps = {
  songs: MediaSong[];
};

export default function DownloadSongButton({ songs }: DownloadSongButtonProps) {
  const { convert } = useConverter();

  return (
    <button
      className="rounded-lg w-full py-3 bg-neutral-800 flex space-x-2 justify-center items-center"
      onClick={async () => {
        songs.forEach(async (song) => {
          const link = await convert(song);

          if (!link) {
            return;
          }

          window.open(link, "_blank");
        });
      }}
    >
      <DownloadIcon className="w-3.5 h-3.5 fill-blue-400" />
      <span className="font-bold text-blue-400">Download</span>
    </button>
  );
}
