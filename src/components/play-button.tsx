"use client";

import PlayIcon from "@/assets/play-icon";
import useConverter from "@/hooks/useConverter";
import { Song } from "@/schemas/song";
import { useQueueStore } from "@/store/queue";

type PlayButtonProps = {
  songs: Song[];
};

export default function PlayButton({ songs }: PlayButtonProps) {
  const { add } = useQueueStore();
  const { convert } = useConverter();

  return (
    <button
      className="rounded-lg w-full py-3 bg-neutral-800 flex space-x-2 justify-center items-center"
      onClick={async () => {
        songs.forEach(async (song) => {
          const link = await convert(song);
          add([{ ...song, previewUrl: link }]);
        });
      }}
    >
      <PlayIcon className="w-3.5 h-3.5 fill-blue-400" />
      <span className="font-bold text-blue-400">Play</span>
    </button>
  );
}
