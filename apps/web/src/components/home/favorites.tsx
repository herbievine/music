import { useFavoritesStore } from "../../store/favorites";
import { Link } from "@tanstack/react-router";

export function Favorites() {
  const { favorites } = useFavoritesStore();

  return (
    <div className="grid grid-cols-2 gap-6">
      {favorites.map((fav) => (
        <Link
          key={fav.id}
          to="/albums/$id"
          params={{
            id: fav.itunesId,
          }}
          className="flex flex-col items-start space-y-2"
        >
          <img
            src={`https://albums.herbievine.com/${fav.bucketCoverId}`}
            alt={`${fav.name} cover`}
            className="w-full rounded-2xl"
            style={{
              viewTransitionName: `album-${fav.itunesId}`,
            }}
          />
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-bold line-clamp-2">{fav.name}</span>
            <span className="text-sm font-bold text-zinc-500">
              {fav.artist.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
