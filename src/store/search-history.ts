import { Media } from "@/types/media";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type SearchHistoryStore = {
  history: Media[];
  add: (song: Media) => void;
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
            .splice(0, 5),
        }));
      },
    }),
    {
      name: "search-history-storage",
      skipHydration: true,
    }
  )
);
