export type MusicImage = {
	url: string;
	width?: number;
	height?: number;
};

export type MusicArtist = {
	id: string;
	name: string;
	images: MusicImage[];
	genres?: string[];
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
	albums: MusicAlbumSummary[];
};

export type MusicSearchResult =
	| MusicTrack
	| MusicAlbumSummary
	| MusicPlaylistSummary
	| MusicArtist;

// --- Home feed ---
// The server decides which sections to show and in what order; the client renders
// them generically per `layout` and links each item per its `type`.
export type HomeItem =
	| MusicTrack
	| MusicAlbumSummary
	| MusicArtist
	| MusicPlaylistSummary;

export type HomeSection = {
	id: string; // stable key, e.g. "quick-picks" or "genre:indie rock"
	title: string | null; // null = render untitled (quick picks)
	layout: "grid" | "row" | "circle-row";
	items: HomeItem[];
};

export type HomeResponse = { sections: HomeSection[] };

export type { AppType } from "./index.js";
