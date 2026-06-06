import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { playHistory } from "../db/schema.js";
import type { MusicAlbumSummary, MusicArtist, MusicTrack } from "../types.js";

export async function getRecentTracks(
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

export async function getRecentAlbums(
	userId: string,
	limit: number,
): Promise<{ items: MusicAlbumSummary[]; total: number }> {
	const rows = await db
		.selectDistinctOn([sql`(${playHistory.metadata}->'album'->>'id')`], {
			metadata: playHistory.metadata,
			playedAt: playHistory.playedAt,
		})
		.from(playHistory)
		.where(eq(playHistory.userId, userId))
		.orderBy(
			sql`(${playHistory.metadata}->'album'->>'id')`,
			desc(playHistory.playedAt),
		)
		.limit(limit);

	rows.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());

	const items: MusicAlbumSummary[] = rows.map((row) => ({
		id: row.metadata.album.id,
		name: row.metadata.album.name,
		artists: row.metadata.artists,
		images: row.metadata.album.images,
		releaseDate: row.metadata.album.releaseDate,
		type: "album" as const,
	}));

	return { items, total: items.length };
}

export async function getRecentArtists(
	userId: string,
	limit: number,
	oauthToken: string,
): Promise<{ items: MusicArtist[]; total: number }> {
	const recentRows = await db
		.select({ metadata: playHistory.metadata })
		.from(playHistory)
		.where(eq(playHistory.userId, userId))
		.orderBy(desc(playHistory.playedAt))
		.limit(100);

	const seenArtistIds = new Set<string>();
	const artistIds: string[] = [];

	for (const row of recentRows) {
		for (const artist of row.metadata.artists) {
			if (!seenArtistIds.has(artist.id)) {
				seenArtistIds.add(artist.id);
				artistIds.push(artist.id);
			}
			if (artistIds.length >= limit) break;
		}
		if (artistIds.length >= limit) break;
	}

	if (artistIds.length === 0) {
		return { items: [], total: 0 };
	}

	const res = await fetch(
		`https://api.spotify.com/v1/artists?ids=${artistIds.join(",")}`,
		{ headers: { Authorization: `Bearer ${oauthToken}` } },
	);

	if (!res.ok) {
		return { items: [], total: 0 };
	}

	const data = (await res.json()) as {
		artists: Array<{
			id: string;
			name: string;
			images: { url: string; width?: number; height?: number }[];
		}>;
	};

	const items: MusicArtist[] = data.artists.filter(Boolean).map((a) => ({
		id: a.id,
		name: a.name,
		images: a.images ?? [],
		type: "artist" as const,
	}));

	return { items, total: items.length };
}

export async function getJumpBackIn(
	userId: string,
): Promise<{ items: MusicAlbumSummary[]; total: number }> {
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const rows = await db
		.selectDistinctOn([sql`(${playHistory.metadata}->'album'->>'id')`], {
			metadata: playHistory.metadata,
			playedAt: playHistory.playedAt,
		})
		.from(playHistory)
		.where(
			and(
				eq(playHistory.userId, userId),
				gte(playHistory.playedAt, thirtyDaysAgo),
			),
		)
		.orderBy(
			sql`(${playHistory.metadata}->'album'->>'id')`,
			desc(playHistory.playedAt),
		)
		.limit(10);

	rows.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());

	const items: MusicAlbumSummary[] = rows.map((row) => ({
		id: row.metadata.album.id,
		name: row.metadata.album.name,
		artists: row.metadata.artists,
		images: row.metadata.album.images,
		releaseDate: row.metadata.album.releaseDate,
		type: "album" as const,
	}));

	return { items, total: items.length };
}

export async function getFrequentlyPlayed(
	userId: string,
	limit: number,
): Promise<{ items: (MusicTrack & { playCount: number })[]; total: number }> {
	const result = await db.execute(sql`
		WITH ranked AS (
			SELECT
				track_id,
				metadata,
				count(*) OVER (PARTITION BY track_id)::int AS play_count,
				row_number() OVER (PARTITION BY track_id ORDER BY played_at DESC) AS rn
			FROM play_history
			WHERE user_id = ${userId}
		)
		SELECT track_id, metadata, play_count
		FROM ranked
		WHERE rn = 1
		ORDER BY play_count DESC
		LIMIT ${limit}
	`);

	const items = (
		result.rows as Array<{
			track_id: string;
			metadata: {
				name: string;
				artists: { id: string; name: string }[];
				album: {
					id: string;
					name: string;
					images: { url: string; width?: number; height?: number }[];
					releaseDate: string;
				};
				durationMs: number;
			};
			play_count: number;
		}>
	).map((row) => ({
		id: row.track_id,
		name: row.metadata.name,
		artists: row.metadata.artists,
		durationMs: row.metadata.durationMs,
		trackNumber: 0,
		type: "track" as const,
		album: row.metadata.album,
		playCount: row.play_count,
	}));

	return { items, total: items.length };
}
