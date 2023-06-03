import { MediaSong } from "@/types/media";
import { create } from "zustand";

type QueueStore = {
  songs: MediaSong[];
  songIndex: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  add: (songs: MediaSong[]) => void;
  remove: (song: MediaSong) => void;
  next: () => void;
  previous: () => void;
};

export const useQueueStore = create<QueueStore>()(
  // persist(
  (set) => ({
    songs: [],
    songIndex: 0,
    isPlaying: false,
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    add: (songs) =>
      set((s) => ({
        songs: [...s.songs, ...songs],
        isPlaying: true,
      })),
    remove: (song) =>
      set((s) => ({ songs: s.songs.filter((i) => i.id !== song.id) })),
    next: () =>
      set((s) =>
        s.songs[s.songIndex + 1]
          ? { songIndex: s.songIndex + 1 }
          : { songIndex: 0, songs: [], isPlaying: false }
      ),
    previous: () =>
      set((s) =>
        s.songIndex - 1 >= 0 ? { songIndex: s.songIndex - 1 } : { songIndex: 0 }
      ),
  })
  //   {
  //     name: "queue-storage",
  //   }
  // )
);
