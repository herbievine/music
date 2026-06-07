import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	albumArtists,
	albumImages,
	albums,
	artists,
	playHistory,
} from "../db/schema.js";
import type { MusicProvider } from "../lib/music-provider.js";
import type {
	HomeItem,
	HomeSection,
	MusicAlbumSummary,
	MusicArtist,
	MusicImage,
	MusicPlaylistSummary,
	MusicTrack,
} from "../types.js";

async function getRecentTracks(
	userId: string,
	limit: number,
): Promise<{ items: MusicTrack[]; total: number }> {
	const rows = await db
		.selectDistinctOn([playHistory.trackId], {
			trackId: playHistory.trackId,
			metadata: playHistory.metadata,
			playedAt: playHistory.playedAt,
		})
		.from(playHistory)
		.where(eq(playHistory.userId, userId))
		.orderBy(playHistory.trackId, desc(playHistory.playedAt))
		.limit(limit);

	rows.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());

	const items: MusicTrack[] = rows.map((row) => ({
		id: row.trackId,
		name: row.metadata.name,
		artists: row.metadata.artists,
		durationMs: row.metadata.durationMs,
		trackNumber: 0,
		type: "track" as const,
		album: row.metadata.album,
	}));

	return { items, total: items.length };
}

// ---------------------------------------------------------------------------
// Home feed: server-driven sections. Each builder returns HomeItem[]; buildHome
// assembles them in order and drops sections that don't clear their min count.
// ---------------------------------------------------------------------------

type PlayRow = {
	track_id: string;
	metadata: {
		name: string;
		artists: { id: string; name: string }[];
		album: {
			id: string;
			name: string;
			images: MusicImage[];
			releaseDate: string;
		};
		durationMs: number;
	};
};

function playRowToTrack(row: PlayRow): MusicTrack {
	return {
		id: row.track_id,
		name: row.metadata.name,
		artists: row.metadata.artists,
		durationMs: row.metadata.durationMs,
		trackNumber: 0,
		type: "track" as const,
		album: row.metadata.album,
	};
}

function titleCase(value: string): string {
	return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Most-played tracks, optionally limited to the last `sinceDays`.
async function mostPlayedTracks(
	userId: string,
	limit: number,
	sinceDays?: number,
): Promise<MusicTrack[]> {
	const since = sinceDays
		? sql`AND played_at > now() - make_interval(days => ${sinceDays})`
		: sql``;
	const result = await db.execute(sql`
		WITH ranked AS (
			SELECT
				track_id,
				metadata,
				count(*) OVER (PARTITION BY track_id)::int AS play_count,
				max(played_at) OVER (PARTITION BY track_id) AS last_played,
				row_number() OVER (PARTITION BY track_id ORDER BY played_at DESC) AS rn
			FROM play_history
			WHERE user_id = ${userId} ${since}
		)
		SELECT track_id, metadata FROM ranked
		WHERE rn = 1
		ORDER BY play_count DESC, last_played DESC
		LIMIT ${limit}
	`);
	return (result.rows as PlayRow[]).map(playRowToTrack);
}

// Fetch full artist objects (name, images, genres) from Spotify, preserving order.
async function fetchSpotifyArtists(
	ids: string[],
	oauthToken: string,
): Promise<MusicArtist[]> {
	if (ids.length === 0) return [];
	const res = await fetch(
		`https://api.spotify.com/v1/artists?ids=${ids.join(",")}`,
		{ headers: { Authorization: `Bearer ${oauthToken}` } },
	);
	if (!res.ok) return [];
	const data = (await res.json()) as {
		artists: Array<{
			id: string;
			name: string;
			images: MusicImage[];
			genres?: string[];
		}>;
	};
	return data.artists.filter(Boolean).map((a) => ({
		id: a.id,
		name: a.name,
		images: a.images ?? [],
		genres: a.genres ?? [],
		type: "artist" as const,
	}));
}

// Reassemble album summaries (artists + images) from the replica for given ids.
async function albumSummariesFromIds(
	ids: string[],
): Promise<MusicAlbumSummary[]> {
	if (ids.length === 0) return [];
	const [albumRows, imgRows, artistRows] = await Promise.all([
		db.select().from(albums).where(inArray(albums.id, ids)),
		db.select().from(albumImages).where(inArray(albumImages.albumId, ids)),
		db
			.select({
				albumId: albumArtists.albumId,
				id: artists.id,
				name: artists.name,
			})
			.from(albumArtists)
			.innerJoin(artists, eq(albumArtists.artistId, artists.id))
			.where(inArray(albumArtists.albumId, ids))
			.orderBy(asc(albumArtists.position)),
	]);

	const imgsByAlbum = new Map<string, MusicImage[]>();
	for (const img of imgRows) {
		const arr = imgsByAlbum.get(img.albumId) ?? [];
		arr.push({
			url: img.url,
			width: img.width ?? undefined,
			height: img.height ?? undefined,
		});
		imgsByAlbum.set(img.albumId, arr);
	}
	const artistsByAlbum = new Map<string, { id: string; name: string }[]>();
	for (const r of artistRows) {
		const arr = artistsByAlbum.get(r.albumId) ?? [];
		arr.push({ id: r.id, name: r.name });
		artistsByAlbum.set(r.albumId, arr);
	}

	// Preserve the input order (callers rank ids meaningfully).
	const byId = new Map(albumRows.map((a) => [a.id, a]));
	return ids
		.map((id) => byId.get(id))
		.filter((a): a is NonNullable<typeof a> => Boolean(a))
		.map((a) => ({
			id: a.id,
			name: a.name,
			artists: artistsByAlbum.get(a.id) ?? [],
			images: imgsByAlbum.get(a.id) ?? [],
			releaseDate: a.releaseDate,
			type: "album" as const,
		}));
}

// Section 0 — Quick picks: most-played tracks in the last 7d, else recents.
async function getQuickPicks(userId: string): Promise<MusicTrack[]> {
	const recent = await mostPlayedTracks(userId, 8, 7);
	if (recent.length > 0) return recent;
	return (await getRecentTracks(userId, 8)).items;
}

// Section 1 — Jump back in: albums replayed 7–30d ago, mixed with playlists the
// user touched in the same window (updatedAt as the engagement proxy).
async function getJumpBackInItems(userId: string): Promise<HomeItem[]> {
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	const albumRows = await db
		.selectDistinctOn([sql`(${playHistory.metadata}->'album'->>'id')`], {
			metadata: playHistory.metadata,
			playedAt: playHistory.playedAt,
		})
		.from(playHistory)
		.where(
			and(
				eq(playHistory.userId, userId),
				gte(playHistory.playedAt, thirtyDaysAgo),
				lte(playHistory.playedAt, sevenDaysAgo),
			),
		)
		.orderBy(
			sql`(${playHistory.metadata}->'album'->>'id')`,
			desc(playHistory.playedAt),
		)
		.limit(10);

	const entries: { item: HomeItem; at: number }[] = albumRows.map((row) => ({
		at: row.playedAt.getTime(),
		item: {
			id: row.metadata.album.id,
			name: row.metadata.album.name,
			artists: row.metadata.artists,
			images: row.metadata.album.images,
			releaseDate: row.metadata.album.releaseDate,
			type: "album" as const,
		},
	}));

	return entries.sort((a, b) => b.at - a.at).map((e) => e.item);
}

// Section 2 — Top artists by play count (details fetched live from Spotify).
async function getTopArtists(
	userId: string,
	oauthToken: string,
): Promise<MusicArtist[]> {
	const rows = (
		await db.execute(sql`
			SELECT a->>'id' AS artist_id, count(*)::int AS cnt
			FROM play_history, jsonb_array_elements(metadata->'artists') AS a
			WHERE user_id = ${userId}
			GROUP BY a->>'id'
			ORDER BY cnt DESC
			LIMIT 10
		`)
	).rows as { artist_id: string; cnt: number }[];
	const ids = rows.map((r) => r.artist_id).filter(Boolean);
	return fetchSpotifyArtists(ids, oauthToken);
}

// The user's most-played genres, derived from genres of the artists they play.
async function topGenres(userId: string, limit: number): Promise<string[]> {
	const rows = (
		await db.execute(sql`
			WITH played_artists AS (
				SELECT DISTINCT a->>'id' AS artist_id
				FROM play_history, jsonb_array_elements(metadata->'artists') AS a
				WHERE user_id = ${userId}
			)
			SELECT g AS genre, count(*)::int AS cnt
			FROM played_artists pa
			JOIN artists ar ON ar.id = pa.artist_id
			CROSS JOIN LATERAL unnest(ar.genres) AS g
			GROUP BY g
			ORDER BY cnt DESC
			LIMIT ${limit}
		`)
	).rows as { genre: string }[];
	return rows.map((r) => r.genre);
}

// Album ids in the replica whose artists carry `genre`, optional artist exclusion.
async function albumIdsForGenre(
	genre: string,
	limit: number,
	excludeArtistId?: string,
): Promise<string[]> {
	const exclude = excludeArtistId
		? sql`AND aa.album_id NOT IN (
				SELECT album_id FROM album_artists WHERE artist_id = ${excludeArtistId}
			)`
		: sql``;
	const rows = (
		await db.execute(sql`
			SELECT DISTINCT aa.album_id
			FROM album_artists aa
			JOIN artists ar ON ar.id = aa.artist_id
			WHERE ${genre} = ANY(ar.genres) ${exclude}
			LIMIT ${limit}
		`)
	).rows as { album_id: string }[];
	return rows.map((r) => r.album_id);
}

// Section 4 — "Because you're into {genre}" rows, from the replica then Spotify.
async function getGenreRows(
	userId: string,
	provider: MusicProvider,
): Promise<HomeSection[]> {
	const genres = await topGenres(userId, 3);
	const sections: HomeSection[] = [];

	for (const genre of genres) {
		const ids = await albumIdsForGenre(genre, 12);
		let items: MusicAlbumSummary[] = await albumSummariesFromIds(ids);

		if (items.length < 4) {
			try {
				const search = await provider.search(`genre:"${genre}"`, "album");
				items = search.results.filter(
					(r): r is MusicAlbumSummary => r.type === "album",
				);
			} catch (err) {
				console.error(`Genre search failed for "${genre}":`, err);
			}
		}

		if (items.length >= 4) {
			sections.push({
				id: `genre:${genre}`,
				title: `Because you're into ${titleCase(genre)}`,
				layout: "row",
				items: items.slice(0, 12),
			});
		}
	}

	return sections;
}

// Section 5 — "More like {artist}": genre-overlap albums for the top artist.
async function getMoreLikeArtist(
	userId: string,
	provider: MusicProvider,
	oauthToken: string,
): Promise<HomeSection | null> {
	const [top] = await getTopArtists(userId, oauthToken);
	if (!top || !top.genres || top.genres.length === 0) return null;

	const ids = (
		await Promise.all(
			top.genres
				.slice(0, 3)
				.map((g) => albumIdsForGenre(g, 8, top.id)),
		)
	).flat();
	const uniqueIds = [...new Set(ids)].slice(0, 12);
	let items: MusicAlbumSummary[] = await albumSummariesFromIds(uniqueIds);

	if (items.length < 4) {
		try {
			const search = await provider.search(
				`genre:"${top.genres[0]}"`,
				"album",
			);
			items = search.results.filter(
				(r): r is MusicAlbumSummary => r.type === "album",
			);
		} catch (err) {
			console.error("More-like search failed:", err);
		}
	}

	if (items.length < 4) return null;
	return {
		id: `more-like:${top.id}`,
		title: `More like ${top.name}`,
		layout: "row",
		items: items.slice(0, 12),
	};
}

// Section 6 — From your library: the user's Spotify playlists + saved albums.
// Sourced from Spotify (real ids + cover art) so cards link to working routes —
// the local user_playlists table isn't viewable over HTTP.
async function getLibraryShortcuts(
	provider: MusicProvider,
): Promise<HomeItem[]> {
	const [playlists, savedAlbums] = await Promise.all([
		provider
			.getUserPlaylists()
			.then((r) => r.items)
			.catch((err) => {
				console.error("User playlists fetch failed:", err);
				return [] as MusicPlaylistSummary[];
			}),
		provider
			.getUserAlbums({ limit: 10 })
			.then((r) => r.items.map((i) => i.album))
			.catch((err) => {
				console.error("Saved albums fetch failed:", err);
				return [] as MusicAlbumSummary[];
			}),
	]);

	return [...playlists.slice(0, 8), ...savedAlbums].slice(0, 16);
}

/**
 * Assemble the home feed. Each section is built independently and resiliently
 * (a failing Spotify call drops its section rather than the whole page), then
 * dropped if it doesn't clear its minimum item count.
 */
export async function buildHome(
	userId: string,
	provider: MusicProvider,
	oauthToken: string,
): Promise<{ sections: HomeSection[] }> {
	const [quickPicks, jumpBackIn, topArtists, genreRows, moreLike, library] =
		await Promise.all([
			getQuickPicks(userId).catch(() => [] as MusicTrack[]),
			getJumpBackInItems(userId).catch(() => [] as HomeItem[]),
			getTopArtists(userId, oauthToken).catch(() => [] as MusicArtist[]),
			getGenreRows(userId, provider).catch(() => [] as HomeSection[]),
			getMoreLikeArtist(userId, provider, oauthToken).catch(() => null),
			getLibraryShortcuts(provider).catch(() => [] as HomeItem[]),
		]);

	const sections: HomeSection[] = [];

	if (quickPicks.length > 0) {
		sections.push({
			id: "quick-picks",
			title: null,
			layout: "grid",
			items: quickPicks,
		});
	}

	if (jumpBackIn.length >= 4) {
		sections.push({
			id: "jump-back-in",
			title: "Jump back in",
			layout: "row",
			items: jumpBackIn,
		});
	}

	if (topArtists.length >= 4) {
		sections.push({
			id: "top-artists",
			title: "Your top artists",
			layout: "circle-row",
			items: topArtists,
		});
	}

	sections.push(...genreRows);
	if (moreLike) sections.push(moreLike);

	if (library.length > 0) {
		sections.push({
			id: "library",
			title: "From your library",
			layout: "row",
			items: library,
		});
	}

	return { sections };
}
