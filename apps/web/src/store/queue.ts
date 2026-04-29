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
	isShuffle: boolean;
	originalSongs: SimpleTrack[];
	showQueuePanel: boolean;
	queueTab: "queue" | "lyrics";
	play: (songs?: SimpleTrack[], songIndex?: number) => void;
	pause: () => void;
	add: (songs: SimpleTrack[]) => void;
	remove: (songId: string) => void;
	next: () => void;
	previous: () => void;
	skipTo: (songId: string) => void;
	reorder: (fromIndex: number, toIndex: number) => void;
	toggleShuffle: () => void;
	toggleQueuePanel: () => void;
	setQueueTab: (tab: "queue" | "lyrics") => void;
};

export const useQueueStore = create<PlaybackStore>()((set) => ({
	songs: [],
	songIndex: -1,
	isPlaying: false,
	isShuffle: false,
	originalSongs: [],
	showQueuePanel: true,
	queueTab: "queue",
	play: (songsToPlay, songIndexToSet) => {
		return set(({ songs, songIndex, isShuffle }) => {
			let newSongs = songsToPlay ?? songs;
			let newIndex =
				songIndexToSet !== undefined
					? songIndexToSet
					: songsToPlay || songIndex === -1
						? 0
						: songIndex;

			// If shuffle is on and new songs are being loaded, shuffle them
			if (isShuffle && songsToPlay) {
				const shuffled = [...newSongs];
				// Shuffle everything after the current track (will be index 0 for new queue)
				for (let i = shuffled.length - 1; i > newIndex; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
				}
				return {
					songs: shuffled,
					isPlaying: true,
					songIndex: newIndex,
					originalSongs: songsToPlay,
				};
			}

			return {
				songs: newSongs,
				isPlaying: true,
				songIndex: newIndex,
			};
		});
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
		return set(({ songs }) => ({
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
	reorder: (fromIndex, toIndex) =>
		set(({ songs, songIndex }) => {
			const newSongs = [...songs];
			const [moved] = newSongs.splice(fromIndex, 1);
			newSongs.splice(toIndex, 0, moved);
			// Recalculate songIndex if current track moved
			let newSongIndex = songIndex;
			if (fromIndex === songIndex) {
				newSongIndex = toIndex;
			} else if (fromIndex < songIndex && toIndex >= songIndex) {
				newSongIndex = songIndex - 1;
			} else if (fromIndex > songIndex && toIndex <= songIndex) {
				newSongIndex = songIndex + 1;
			}
			return { songs: newSongs, songIndex: newSongIndex };
		}),
	toggleQueuePanel: () => set(({ showQueuePanel }) => ({ showQueuePanel: !showQueuePanel })),
	setQueueTab: (tab) => set({ queueTab: tab }),
	toggleShuffle: () =>
		set(({ isShuffle, songs, songIndex, originalSongs }) => {
			if (!isShuffle) {
				// Turn ON: shuffle songs after current position, keep history intact
				const before = songs.slice(0, songIndex + 1);
				const after = songs.slice(songIndex + 1);
				// Fisher-Yates shuffle
				for (let i = after.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[after[i], after[j]] = [after[j], after[i]];
				}
				return {
					isShuffle: true,
					originalSongs: songs,
					songs: [...before, ...after],
				};
			}
			// Turn OFF: restore original order, find current song's position in it
			const currentId = songs[songIndex]?.id;
			const restoredIndex = originalSongs.findIndex((s) => s.id === currentId);
			return {
				isShuffle: false,
				originalSongs: [],
				songs: originalSongs,
				songIndex: restoredIndex >= 0 ? restoredIndex : songIndex,
			};
		}),
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
