import { Media } from "@/types/media";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoritesStore = {
  favorites: Media[];
  add: (song: Media) => void;
  remove: (song: Media) => void;
};

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set) => ({
      favorites: [],
      add: (song) => {
        set((s) => ({
          favorites: [song, ...s.favorites].filter(
            (val, index, self) =>
              self.findIndex((t) => t.id === val.id) === index
          ),
        }));
      },
      remove: (song) => {
        set((s) => ({
          favorites: s.favorites.filter((t) => t.id !== song.id),
        }));
      },
    }),
    {
      name: "favorites-storage",
      skipHydration: true,
    }
  )
);
