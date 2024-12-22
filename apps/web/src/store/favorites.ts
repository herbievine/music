import type { Album, Artist } from "@music/haxel";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoritesStore = {
  favorites: (Album & { artist: Artist })[];
  add: (fav: Album & { artist: Artist }) => void;
  remove: (id: string) => void;
};

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set) => ({
      favorites: [],
      add: (fav) => {
        set((s) => ({
          favorites: [fav, ...s.favorites].filter(
            (val, index, self) =>
              self.findIndex((t) => t.id === val.id) === index,
          ),
        }));
      },
      remove: (id) => {
        set((s) => ({
          favorites: s.favorites.filter((t) => t.id !== id),
        }));
      },
    }),
    {
      name: "favorites-storage",
    },
  ),
);
