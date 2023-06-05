"use client";

import { useFavoritesStore } from "@/store/favorites";
import { useEffect } from "react";
import MediaViewer from "@/components/media-viewer";

export default function Favorites() {
  const { favorites } = useFavoritesStore();

  useEffect(() => {
    useFavoritesStore.persist.rehydrate();
  }, []);

  if (favorites.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="font-bold border-b border-neutral-800 pb-2">Favorites</p>
      <div className="flex flex-col divide-y divide-neutral-800">
        {favorites.map((media) => (
          <MediaViewer key={media.id} media={media} />
        ))}
      </div>
    </div>
  );
}
