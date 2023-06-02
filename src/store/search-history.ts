import { create } from "zustand";
import { persist } from "zustand/middleware";

type SongOrAlbum = {
  id: number;
  type: "song" | "album";
  title: string;
  artist: string;
  coverLink: string;
};

type SearchHistoryStore = {
  history: SongOrAlbum[];
  add: (song: SongOrAlbum) => void;
};

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set) => ({
      history: [],
      add: (song) => {
        set((s) => ({
          history: [song, ...s.history]
            .filter(
              (val, index, self) =>
                self.findIndex((t) => t.id === val.id) === index
            )
            .slice(-5),
        }));
      },
    }),
    {
      name: "search-history-storage",
    }
  )
);
