import type {
	MusicAlbum,
	MusicAlbumSummary,
	MusicPlaylist,
	MusicPlaylistSummary,
	MusicSearchResult,
	MusicTrack,
} from "../types.js";

export interface MusicProvider {
	getAlbum(id: string): Promise<MusicAlbum>;
	getTrack(id: string): Promise<MusicTrack>;
	getPlaylist(id: string): Promise<MusicPlaylist>;

	getUserAlbums(options?: { limit?: number; offset?: number }): Promise<{
		items: { addedAt: string; album: MusicAlbumSummary }[];
	}>;

	getUserPlaylists(): Promise<{
		items: MusicPlaylistSummary[];
		total: number;
	}>;

	getTopTracks(options?: {
		timeRange?: "short_term" | "medium_term" | "long_term";
		limit?: number;
		offset?: number;
	}): Promise<{
		items: MusicTrack[];
		total: number;
	}>;

	getNewReleases(options?: { limit?: number }): Promise<{
		items: MusicAlbumSummary[];
		total: number;
	}>;

	search(
		query: string,
		type: "track" | "album" | "artist" | "playlist",
	): Promise<{
		results: MusicSearchResult[];
		total: number;
	}>;
}
