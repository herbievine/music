"use client";

import formatDuration from "@/lib/formatDuration";
import { MediaSong } from "@/types/media";
import dayjs from "dayjs";

type MetadataProps = {
  songs: MediaSong[];
};

export default function Metadata({ songs }: MetadataProps) {
  const totalDuration = songs.reduce((acc, song) => acc + song.duration, 0);

  return (
    <div className="w-full">
      <p className="text-neutral-500 font-bold text-sm">
        {dayjs(songs[0].releaseDate).format("DD MMMM, YYYY")}
      </p>
      <p className="text-neutral-500 font-bold text-sm">
        {songs.length} {songs.length > 1 ? "songs" : "song"},{" "}
        {formatDuration(totalDuration)} total
      </p>
    </div>
  );
}
