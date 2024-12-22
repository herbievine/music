import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { MediaHeader } from "../../components/media/header";
import { trpc } from "../../utils/trpc";
import { formatTime } from "../../lib/format-time";
import { useQueueStore } from "../../store/queue";
import { Button } from "../../components/ui/button";
import { ChevronLeft, Heart, HeartOff, Play } from "lucide-react";
import { useFavoritesStore } from "../../store/favorites";
import { useMemo } from "react";

export const Route = createFileRoute("/albums/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/albums/$id" });
  const { data: album } = trpc.getAlbumById.useQuery({ albumId: id });
  const { data: songs } = trpc.getAlbumTracks.useQuery(id);
  const { add, play } = useQueueStore();
  const { favorites, add: favorite, remove } = useFavoritesStore();

  const isFavorite = useMemo(() => {
    return favorites.some((fav) => fav.itunesId === id);
  }, [favorites, id]);

  return (
    <div className="flex flex-col space-y-4 pb-20">
      <Link to="/" className="px-4 py-1">
        <ChevronLeft strokeWidth={2.5} size={20} />
      </Link>
      <MediaHeader id={id} />
      <div className="px-4 flex space-x-4">
        <Button
          onClick={() => {
            if (songs) {
              add(songs);
              play();
            }
          }}
          className="flex space-x-2 items-center justify-center"
        >
          <Play strokeWidth={2.5} size={16} fill="#f4f4f5" />
          <span>Play</span>
        </Button>
        <Button
          onClick={() => {
            if (isFavorite) {
              remove(id);
            } else if (album) {
              favorite(album);
            }
          }}
          className="flex space-x-2 items-center justify-center"
        >
          {isFavorite ? (
            <HeartOff strokeWidth={2.5} size={16} fill="#f4f4f5" />
          ) : (
            <Heart strokeWidth={2.5} size={16} fill="#f4f4f5" />
          )}
          <span>{isFavorite ? "Remove" : "Add"}</span>
        </Button>
      </div>
      <div className="flex flex-col divide-y divide-zinc-800">
        {songs
          ? songs.length > 0 &&
            songs.map((track) => (
              <button
                key={track.id}
                onClick={() => {
                  console.log(track);
                  add([track]);
                  play();
                }}
                className="px-4 py-2 flex justify-between items-center"
              >
                <div className="flex flex-col items-start">
                  <span className="line-clamp-1 text-left">{track.name}</span>
                  <span className="text-sm text-zinc-500">
                    {track.artist.name} - {formatTime(track.trackTimeMillis)}
                  </span>
                </div>
              </button>
            ))
          : [...new Array(12).fill("0")].map((_, i) => (
              <div
                key={i}
                className="px-4 py-2 flex justify-between items-center"
              >
                <div className="flex flex-col items-start space-y-2">
                  <div className="h-5 w-40 bg-zinc-800 rounded-2xl animate-pulse" />
                  <div className="h-4 w-52 bg-zinc-800 rounded-2xl animate-pulse" />
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
