export type MusicImage = {
	url: string;
	width?: number;
	height?: number;
};

export type MusicArtist = {
	id: string;
	name: string;
	images: MusicImage[];
	type: "artist";
};

export type MusicTrackSimplified = {
	id: string;
	name: string;
	durationMs: number;
	trackNumber: number;
	artists: { id: string; name: string }[];
	type: "track";
};

export type MusicTrack = MusicTrackSimplified & {
	album: {
		id: string;
		name: string;
		images: MusicImage[];
		releaseDate: string;
	};
};

export type MusicAlbumSummary = {
	id: string;
	name: string;
	artists: { id: string; name: string }[];
	images: MusicImage[];
	releaseDate: string;
	type: "album";
};

export type MusicAlbum = MusicAlbumSummary & {
	totalTracks: number;
	tracks: {
		total: number;
		items: MusicTrackSimplified[];
	};
};

export type MusicPlaylistSummary = {
	id: string;
	name: string;
	description: string;
	images: MusicImage[];
	type: "playlist";
};

export type MusicPlaylist = MusicPlaylistSummary & {
	tracks: {
		total: number;
		items: { track: MusicTrack }[];
	};
};

export type MusicArtistDetail = MusicArtist & {
	topTracks: MusicTrack[];
};

export type MusicSearchResult =
	| MusicTrack
	| MusicAlbumSummary
	| MusicPlaylistSummary
	| MusicArtist;

export type { AppType } from "./index.js";
