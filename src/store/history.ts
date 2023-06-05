import { Media } from "@/types/media";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type HistoryStore = {
  history: Media[];
  add: (song: Media) => void;
};

export const useHistoryStore = create<HistoryStore>()(
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
      name: "history-storage",
      skipHydration: true,
    }
  )
);
