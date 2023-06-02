import formatDuration from "@/lib/formatDuration";
import { Song } from "@/schemas/song";
import dayjs from "dayjs";

type MetadataProps = {
  songs: Song[];
};

export default function Metadata({ songs }: MetadataProps) {
  const totalDuration = songs.reduce(
    (acc, song) => acc + song.trackTimeMillis,
    0
  );

  return (
    <div className="w-full">
      <p className="text-neutral-500 font-bold text-sm">
        {dayjs(songs[0].releaseDate).format("DD MMMM, YYYY")}
      </p>
      <p className="text-neutral-500 font-bold text-sm">
        {songs.length} {songs.length > 1 ? "songs" : "song"}, duration{" "}
        {formatDuration(totalDuration)}
      </p>
    </div>
  );
}
