"use client";

import HeartIcon from "@/assets/heart-icon";
import cn from "@/lib/cn";
import { useFavoritesStore } from "@/store/favorites";
import { Media } from "@/types/media";
import { useMemo } from "react";

type FavoritesButtonProps = {
  media: Media;
};

export default function FavoritesButton({ media }: FavoritesButtonProps) {
  const { add, remove, favorites } = useFavoritesStore();

  const isFavorite = useMemo(
    () => !!favorites.find((song) => song.id === media.id),
    [favorites, media]
  );

  return (
    <button
      className="rounded-lg w-full py-3 bg-neutral-800 flex space-x-2 justify-center items-center"
      onClick={() => {
        if (isFavorite) {
          remove(media);
        } else {
          add(media);
        }
      }}
    >
      <HeartIcon
        className={cn(isFavorite ? "fill-red-400" : "fill-blue-400")}
      />
      <span
        className={cn(
          "font-bold",
          isFavorite ? "text-red-400" : "text-blue-400"
        )}
      >
        {isFavorite ? "Remove" : "Add"}
      </span>
    </button>
  );
}
