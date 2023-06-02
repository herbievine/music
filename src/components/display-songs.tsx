"use client";

import useConverter from "@/hooks/useConverter";
import trackTime from "@/lib/trackTime";
import { Song } from "@/schemas/song";
import { useQueueStore } from "@/store/queue";

type DisplaySongsProps = {
  songs: Song[];
};

export default function DisplaySongs({ songs }: DisplaySongsProps) {
  const { add } = useQueueStore();
  const { convert } = useConverter();

  return (
    <div className="w-full flex flex-col border-y border-neutral-800 divide-y divide-neutral-800">
      {songs.map((song) => (
        <div
          key={song.trackId}
          className="flex justify-between py-2 font-semibold"
          onClick={async () => {
            const link = await convert(song);
            add([{ ...song, previewUrl: link }]);
          }}
        >
          <div className="flex space-x-2">
            <p className="text-neutral-500">{song.trackNumber}</p>
            <p>{song.trackName}</p>
          </div>
          <p>{trackTime(song.trackTimeMillis)}</p>
        </div>
      ))}
    </div>
  );
}
