import { Song } from "@/schemas/song";
import { create } from "zustand";

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
