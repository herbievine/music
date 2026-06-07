import type {
	Album,
	Artist,
	Playlist,
	SimplifiedPlaylist,
	Track,
	TrackSimplified,
} from "@statsfm/spotify.js";
import { SpotifyAPI } from "@statsfm/spotify.js";
import type {
	MusicAlbum,
	MusicAlbumSummary,
	MusicArtist,
	MusicArtistDetail,
	MusicImage,
	MusicPlaylist,
	MusicPlaylistSummary,
	MusicSearchResult,
	MusicTrack,
	MusicTrackSimplified,
} from "../types.js";
import type { MusicProvider } from "./music-provider.js";

function mapImage(image: {
	url: string;
	width?: number;
	height?: number;
}): MusicImage {
	return { url: image.url, width: image.width, height: image.height };
}

function mapTrackSimplified(track: TrackSimplified): MusicTrackSimplified {
	return {
		id: track.id,
		name: track.name,
		durationMs: track.duration_ms,
		trackNumber: track.track_number,
		artists: track.artists.map((a) => ({ id: a.id, name: a.name })),
		type: "track" as const,
	};
}

function mapTrack(track: Track): MusicTrack {
	return {
		...mapTrackSimplified(track),
		album: {
			id: track.album.id,
			name: track.album.name ?? "",
			images: track.album.images.map(mapImage),
			releaseDate: track.album.release_date ?? "",
		},
	};
}

function mapAlbumSummary(album: Album): MusicAlbumSummary {
	return {
		id: album.id,
		name: album.name ?? "",
		artists: (album.artists ?? []).map((a) => ({ id: a.id, name: a.name })),
		images: (album.images ?? []).map(mapImage),
		releaseDate: album.release_date ?? "",
		type: "album" as const,
	};
}

function mapAlbum(album: Album): MusicAlbum {
	return {
		...mapAlbumSummary(album),
		totalTracks: album.total_tracks,
		tracks: {
			total: album.tracks.total,
			items: album.tracks.items.map(mapTrackSimplified),
		},
	};
}

function mapPlaylistSummary(
	playlist: Playlist | SimplifiedPlaylist,
): MusicPlaylistSummary {
	return {
		id: playlist.id,
		name: playlist.name,
		description: playlist.description ?? "",
		images: playlist.images.map(mapImage),
		type: "playlist" as const,
	};
}

function mapPlaylist(playlist: Playlist): MusicPlaylist {
	return {
		...mapPlaylistSummary(playlist),
		tracks: {
			total: playlist.tracks.total,
			items: playlist.tracks.items
				.filter((item) => item.track != null)
				.map((item) => ({ track: mapTrack(item.track) })),
		},
	};
}

function mapArtist(artist: Artist): MusicArtist {
	return {
		id: artist.id,
		name: artist.name,
		images: (artist.images ?? []).map(mapImage),
		type: "artist" as const,
	};
}

export class SpotifyProvider implements MusicProvider {
	private client: SpotifyAPI;
	private token: string;

	constructor(token: string) {
		this.token = token;
		this.client = new SpotifyAPI({
			clientCredentials: {
				clientId: process.env.SPOTIFY_CLIENT_ID,
				clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
			},
			accessToken: token,
		});
	}

	async getAlbum(id: string): Promise<MusicAlbum> {
		const album = await this.client.albums.get(id);
		return mapAlbum(album);
	}

	async getTrack(id: string): Promise<MusicTrack> {
		const track = await this.client.tracks.get(id);
		return mapTrack(track);
	}

	async getArtist(id: string): Promise<MusicArtistDetail> {
		const [artistRes, firstAlbumsRes] = await Promise.all([
			fetch(`https://api.spotify.com/v1/artists/${encodeURIComponent(id)}`, {
				headers: { Authorization: `Bearer ${this.token}` },
			}),
			// limit=10 is the effective max for this app's API access level
			fetch(
				`https://api.spotify.com/v1/artists/${encodeURIComponent(id)}/albums?limit=10&include_groups=album,single,compilation`,
				{ headers: { Authorization: `Bearer ${this.token}` } },
			),
		]);

		if (!artistRes.ok) {
			const body = await artistRes.json().catch(() => null);
			console.error("Spotify artist error", artistRes.status, JSON.stringify(body));
			throw new Error(`Could not fetch artist: ${artistRes.status} ${JSON.stringify(body)}`);
		}
		if (!firstAlbumsRes.ok) {
			const body = await firstAlbumsRes.json().catch(() => null);
			console.error("Spotify artist albums error", firstAlbumsRes.status, JSON.stringify(body));
			throw new Error(`Could not fetch artist albums: ${firstAlbumsRes.status} ${JSON.stringify(body)}`);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const artist = (await artistRes.json()) as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const firstPage = (await firstAlbumsRes.json()) as { items: any[]; next: string | null };

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const allAlbums: any[] = [...firstPage.items];
		let nextUrl = firstPage.next;
		let pages = 1;

		while (nextUrl && pages < 5) {
			const res = await fetch(nextUrl, { headers: { Authorization: `Bearer ${this.token}` } });
			if (!res.ok) break;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const data = (await res.json()) as { items: any[]; next: string | null };
			allAlbums.push(...data.items);
			nextUrl = data.next;
			pages++;
		}

		return {
			id: artist.id,
			name: artist.name,
			images: (artist.images ?? []).map(mapImage),
			type: "artist" as const,
			albums: allAlbums.filter(Boolean).map(mapAlbumSummary),
		};
	}

	async getPlaylist(id: string): Promise<MusicPlaylist> {
		const playlist = await this.client.playlist.get(id);
		return mapPlaylist(playlist);
	}

	async getUserAlbums(options?: {
		limit?: number;
		offset?: number;
	}): Promise<{ items: { addedAt: string; album: MusicAlbumSummary }[] }> {
		const url = new URL("/v1/me/albums", "https://api.spotify.com");
		url.searchParams.append("limit", String(options?.limit ?? 10));
		url.searchParams.append("offset", String(options?.offset ?? 0));

		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${this.token}` },
		});

		if (!res.ok) {
			throw new Error("Could not retrieve user albums");
		}

		const data = (await res.json()) as {
			items: { added_at: string; album: Album }[];
		};

		return {
			items: data.items.map((item) => ({
				addedAt: item.added_at,
				album: mapAlbumSummary(item.album),
			})),
		};
	}

	async getUserPlaylists(): Promise<{
		items: MusicPlaylistSummary[];
		total: number;
	}> {
		const result = await this.client.me.playlists();
		return {
			items: result.items.map(mapPlaylistSummary),
			total: result.total,
		};
	}

	async getTopTracks(options?: {
		timeRange?: "short_term" | "medium_term" | "long_term";
		limit?: number;
		offset?: number;
	}): Promise<{ items: MusicTrack[]; total: number }> {
		const result = await this.client.me.top("tracks", {
			timeRange: options?.timeRange ?? "medium_term",
			limit: options?.limit ?? 20,
			offset: options?.offset ?? 0,
		});
		return {
			items: result.items.map(mapTrack),
			total: result.total,
		};
	}

	async getNewReleases(options?: {
		limit?: number;
	}): Promise<{ items: MusicAlbumSummary[]; total: number }> {
		const result = await this.client.albums.newReleases({
			limit: options?.limit ?? 10,
		});
		return {
			items: result.albums.items.map(mapAlbumSummary),
			total: result.albums.total,
		};
	}

	async search(
		query: string,
		type: "track" | "album" | "artist" | "playlist",
	): Promise<{ results: MusicSearchResult[]; total: number }> {
		const url = new URL("/v1/search", "https://api.spotify.com");
		url.searchParams.append("q", query);
		url.searchParams.append("type", type);
		url.searchParams.append("limit", "20");

		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${this.token}` },
		});

		if (!res.ok) {
			const body = await res.json().catch(() => null);
			console.error("Spotify search error", res.status, JSON.stringify(body));
			throw new Error(`Search failed: ${res.status} ${JSON.stringify(body)}`);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data = (await res.json()) as any;

		let items: MusicSearchResult[] = [];
		let total = 0;

		if (type === "track" && data.tracks) {
			items = data.tracks.items.filter(Boolean).map(mapTrack);
			total = data.tracks.total;
		} else if (type === "album" && data.albums) {
			items = data.albums.items.filter(Boolean).map(mapAlbumSummary);
			total = data.albums.total;
		} else if (type === "artist" && data.artists) {
			items = data.artists.items.filter(Boolean).map(mapArtist);
			total = data.artists.total;
		} else if (type === "playlist" && data.playlists) {
			items = data.playlists.items.filter(Boolean).map(mapPlaylistSummary);
			total = data.playlists.total;
		}

		return { results: items, total };
	}
}
