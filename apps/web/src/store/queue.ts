import type { Album, Artist, Song } from "@music/haxel";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type QueueStore = {
  songs: (Song & { album: Album; artist: Artist })[];
  songIndex: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  add: (songs: (Song & { album: Album; artist: Artist })[]) => void;
  remove: (song: Song & { album: Album; artist: Artist }) => void;
  next: () => void;
  previous: () => void;
  skipTo: (song: Song & { album: Album; artist: Artist }) => void;
};

export const useQueueStore = create<QueueStore>()(
  // persist(
  (set) => ({
    songs: [],
    songIndex: -1,
    isPlaying: false,
    play: () =>
      set(({ songIndex }) => ({
        isPlaying: true,
        songIndex: songIndex === -1 ? 0 : songIndex,
      })),
    pause: () => set({ isPlaying: false }),
    add: (songs) =>
      set((s) => ({
        songs: [...s.songs, ...songs].filter(
          (val, index, self) =>
            self.findIndex((t) => t.id === val.id) === index,
        ),
        isPlaying: true,
      })),
    remove: (song) =>
      set((s) => ({
        songs: s.songs.filter((i) => i.id !== song.id),
      })),
    next: () =>
      set(({ songs, songIndex }) =>
        songs[songIndex + 1]
          ? { songIndex: songIndex + 1 }
          : { songIndex: -1, songs: [], isPlaying: false },
      ),
    previous: () =>
      set((s) =>
        s.songIndex - 1 >= 0
          ? { songIndex: s.songIndex - 1 }
          : { songIndex: -1 },
      ),
    skipTo: (song) =>
      set((s) => ({
        songIndex: s.songs.indexOf(song),
      })),
  }),
  //   {
  //     name: "queue-storage",
  //   },
  // ),
);
