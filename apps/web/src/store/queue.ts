import { create } from "zustand";

export type SimpleTrack = {
	id: string;
	name: string;
	durationMs: number;
	artists: { id: string; name: string }[];
	album: {
		id: string;
		name: string;
		image: string;
	};
};

type PlaybackStore = {
	songs: SimpleTrack[];
	songIndex: number;
	isPlaying: boolean;
	play: (songs?: SimpleTrack[]) => void;
	pause: () => void;
	add: (songs: SimpleTrack[]) => void;
	remove: (songId: string) => void;
	next: () => void;
	previous: () => void;
	skipTo: (songId: string) => void;
};

export const useQueueStore = create<PlaybackStore>()((set) => ({
	songs: [],
	songIndex: -1,
	isPlaying: false,
	play: (songsToPlay) => {
		return set(({ songs, songIndex }) => ({
			songs: songsToPlay ? songsToPlay : songs,
			isPlaying: true,
			songIndex: songIndex === -1 ? 0 : songIndex,
		}));
	},
	pause: () => set({ isPlaying: false }),
	add: (songsToAdd) =>
		set(({ songs }) => ({
			songs: [...songs, ...songsToAdd].filter(
				(id, index, self) => self.indexOf(id) === index,
			),
			isPlaying: true,
		})),
	remove: (songId) => {
		set(({ songs }) => ({
			songs: songs.filter(({ id }) => id !== songId),
		}));
	},
	next: () =>
		set(({ songs, songIndex }) => {
			const isNextSong = songs.length > songIndex + 1;

			if (isNextSong) {
				return { songIndex: songIndex + 1 };
			}

			return {
				songIndex: -1,
				songs: [],
				isPlaying: false,
			};
		}),
	previous: () =>
		set((s) =>
			s.songIndex - 1 >= 0 ? { songIndex: s.songIndex - 1 } : { songIndex: -1 },
		),
	skipTo: (songId) =>
		set((s) => ({
			songIndex: s.songs.findIndex((song) => song.id === songId),
		})),
}));

// type QueueStore = {
// 	songs: (Song & { album: Album; artist: Artist })[];
// 	songIndex: number;
// 	isPlaying: boolean;
// 	play: () => void;
// 	pause: () => void;
// 	add: (songs: (Song & { album: Album; artist: Artist })[]) => void;
// 	remove: (song: Song & { album: Album; artist: Artist }) => void;
// 	next: () => void;
// 	previous: () => void;
// 	skipTo: (song: Song & { album: Album; artist: Artist }) => void;
// };

// export const useQueueStore = create<QueueStore>()((set) => ({
// 	songs: [],
// 	songIndex: -1,
// 	isPlaying: false,
// 	play: () =>
// 		set(({ songIndex }) => ({
// 			isPlaying: true,
// 			songIndex: songIndex === -1 ? 0 : songIndex,
// 		})),
// 	pause: () => set({ isPlaying: false }),
// 	add: (songs) =>
// 		set((s) => ({
// 			songs: [...s.songs, ...songs].filter(
// 				(val, index, self) => self.findIndex((t) => t.id === val.id) === index,
// 			),
// 			isPlaying: true,
// 		})),
// 	remove: (song) =>
// 		set((s) => ({
// 			songs: s.songs.filter((i) => i.id !== song.id),
// 		})),
// 	next: () =>
// 		set(({ songs, songIndex }) =>
// 			songs[songIndex + 1]
// 				? { songIndex: songIndex + 1 }
// 				: { songIndex: -1, songs: [], isPlaying: false },
// 		),
// 	previous: () =>
// 		set((s) =>
// 			s.songIndex - 1 >= 0 ? { songIndex: s.songIndex - 1 } : { songIndex: -1 },
// 		),
// 	skipTo: (song) =>
// 		set((s) => ({
// 			songIndex: s.songs.indexOf(song),
// 		})),
// }));
