"use client";

import useConverter from "@/hooks/useConverter";
import formatDuration from "@/lib/formatDuration";
import { useQueueStore } from "@/store/queue";
import { MediaSong } from "@/types/media";

type DisplaySongsProps = {
  songs: MediaSong[];
};

export default function DisplaySongs({ songs }: DisplaySongsProps) {
  const { add } = useQueueStore();
  const { convert } = useConverter();

  return (
    <div className="w-full flex flex-col border-y border-neutral-800 divide-y divide-neutral-800">
      {songs.map((song) => (
        <div
          key={song.id}
          className="flex justify-between py-3 font-semibold hover:text-blue-400 cursor-pointer"
          onClick={async () => {
            const link = await convert(song);

            if (!link) {
              return;
            }

            add([{ ...song, audioLink: link }]);
          }}
        >
          <div className="flex space-x-2">
            <p className="text-neutral-500">{song.trackNumber}</p>
            <p>{song.title}</p>
          </div>
          <p className="text-white">{formatDuration(song.duration)}</p>
        </div>
      ))}
    </div>
  );
}
