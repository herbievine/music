import dayjs from "dayjs";
import { trpc } from "../../utils/trpc";

type Props = {
  id: string;
};

export function MediaHeader({ id }: Props) {
  const { data } = trpc.getAlbumById.useQuery(id);

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <img
        src={data.artworkUrl100.replace("100x100", "1000x1000")}
        alt={`${data.collectionName} cover`}
        className="w-52 h-52 rounded-2xl"
      />
      <div className="flex flex-col items-center space-y-1">
        <h1 className="text-xl font-bold">{data.collectionName}</h1>
        <span className="text-sm font-bold">{data.artist.artistName}</span>
        <span className="text-xs font-bold uppercase text-zinc-500">
          {data.primaryGenreName} - {dayjs(data.releaseDate).format("YYYY")}
        </span>
      </div>
    </div>
  );
}
