"use client";

import formatDuration from "@/lib/formatDuration";
import { Media } from "@/types/media";
import dayjs from "dayjs";

type MetadataProps = {
  media: Media;
};

export default function Metadata({ media }: MetadataProps) {
  const { totalDuration, songLength } =
    media.type === "song"
      ? {
          totalDuration: media.duration,
          songLength: 1,
        }
      : media.songs.reduce(
          (acc, song) => ({
            ...acc,
            totalDuration: acc.totalDuration + song.duration,
          }),
          {
            totalDuration: 0,
            songLength: media.songs.length,
          }
        );

  return (
    <div className="w-full flex flex-col items-center">
      <p className="text-neutral-500 font-bold text-sm">
        {dayjs(media.releaseDate).format("DD MMMM, YYYY")}
      </p>
      <p className="text-neutral-500 font-bold text-sm">
        {songLength} {songLength > 1 ? "songs" : "song"},{" "}
        {formatDuration(totalDuration)} total
      </p>
    </div>
  );
}
