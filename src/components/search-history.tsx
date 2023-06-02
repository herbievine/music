import { useSearchHistoryStore } from "@/store/search-history";
import Link from "next/link";
import Image from "next/image";

export default function SearchHistory() {
  const { history } = useSearchHistoryStore();

  return (
    <div>
      <p className="font-bold border-b border-neutral-800 pb-2">History</p>
      <div className="flex flex-col divide-y divide-neutral-800">
        {history.map((songOrAlbum) => (
          <Link
            key={songOrAlbum.id}
            className="py-2 cursor-pointer"
            href={`/view?id=${songOrAlbum.id}`}
          >
            <div className={"w-full flex items-center space-x-2"}>
              <Image
                src={songOrAlbum.coverLink}
                alt={`${songOrAlbum.title} by ${songOrAlbum.artist}`}
                width={45}
                height={45}
                className="rounded-lg"
              />
              <div className="flex flex-col">
                <p className="font-semibold">{songOrAlbum.title}</p>
                <p className="text-sm font-semibold text-neutral-500 truncate">
                  {songOrAlbum.type === "song" ? "Song" : "Album"}
                  {" • "}
                  {songOrAlbum.artist}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
