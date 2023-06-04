"use client";

import DownloadIcon from "@/assets/download-icon";
import useConverter from "@/hooks/useConverter";
import { MediaSong } from "@/types/media";

type DownloadSongButtonProps = {
  song: MediaSong;
};

export default function DownloadSongButton({ song }: DownloadSongButtonProps) {
  const { convert } = useConverter();

  return (
    <button
      onClick={async () => {
        const link = await convert(song);

        if (!link) {
          return;
        }

        window.open(link, "_blank");
      }}
    >
      <DownloadIcon className="fill-blue-400" />
    </button>
  );
}
