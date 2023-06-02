import { Song } from "@/schemas/song";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type QueueSong = {
  id: number;
  title: string;
  artist: string;
  album: string;
  coverLink: string;
  audioLink: string;
  duration: number;
};

type QueueStore = {
  songs: QueueSong[];
  songIndex: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  add: (songs: Song[]) => void;
  remove: (song: Song) => void;
  next: () => void;
  playPrev: () => void;
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
        songs: [
          ...s.songs,
          ...songs.map((song) => ({
            id: song.trackId,
            title: song.trackName,
            artist: song.artistName,
            album: song.collectionName,
            coverLink: song.artworkUrl100,
            audioLink: song.previewUrl,
            duration: song.trackTimeMillis,
          })),
        ],
        isPlaying: true,
      })),
    remove: (song) =>
      set((s) => ({ songs: s.songs.filter((i) => i.id !== song.trackId) })),
    next: () => set((s) => ({ songIndex: s.songIndex + 1 })),
    playPrev: () => set((s) => ({ songIndex: s.songIndex - 1 })),
  })
  //   {
  //     name: "queue-storage",
  //   }
  // )
);
