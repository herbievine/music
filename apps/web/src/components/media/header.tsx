import dayjs from "dayjs";
import { trpc } from "../../utils/trpc";

type Props = {
  id: string;
};

export function MediaHeader({ id }: Props) {
  const { data } = trpc.getAlbumById.useQuery({ albumId: id });

  if (!data) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-52 h-52 bg-zinc-800 rounded-2xl animate-pulse" />
        <div className="flex flex-col items-center space-y-2">
          <div className="h-6 w-40 bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-4 w-28 bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="h-4 w-32 bg-zinc-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <img
        src={`https://albums.herbievine.com/${data.bucketCoverId}`}
        alt={`${data.name} cover`}
        className="w-52 h-52 rounded-2xl"
      />
      <div className="flex flex-col items-center space-y-1">
        <h1 className="text-xl font-semibold text-center">{data.name}</h1>
        <span className="text-sm font-semibold text-center">
          {data.artist.name}
        </span>
        <span className="text-xs font-semibold uppercase text-zinc-500">
          {data.primaryGenreName} - {dayjs(data.releaseDate).format("YYYY")}
        </span>
      </div>
    </div>
  );
}
