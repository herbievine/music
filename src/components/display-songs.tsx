"use client";

import useConverter from "@/hooks/useConverter";
import { useQueueStore } from "@/store/queue";
import { MediaSong } from "@/types/media";
import DownloadSongButton from "@/components/download-song-button";

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
          className="flex justify-between font-semibold space-x-2 px-1"
        >
          <div
            className="grow flex space-x-2 py-3 hover:text-blue-400 cursor-pointer"
            onClick={async () => {
              const link = await convert(song);

              if (!link) {
                return;
              }

              add([{ ...song, audioLink: link }]);
            }}
          >
            <p className="text-neutral-500">{song.trackNumber}</p>
            <p>{song.title}</p>
          </div>
          <div className="flex space-x-4">
            <DownloadSongButton song={song} />
          </div>
        </div>
      ))}
    </div>
  );
}
