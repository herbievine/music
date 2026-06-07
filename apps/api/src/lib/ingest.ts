import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
	albumArtists,
	albumImages,
	albums,
	artistImages,
	artists,
	trackArtists,
	tracks,
} from "../db/schema.js";
import type {
	MusicAlbum,
	MusicAlbumSummary,
	MusicArtistDetail,
	MusicTrack,
} from "../types.js";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ArtistRef = { id: string; name: string };
type ImageRef = { url: string; width?: number; height?: number };

function mapImageRow(img: {
	url: string;
	width: number | null;
	height: number | null;
}): ImageRef {
	return {
		url: img.url,
		width: img.width ?? undefined,
		height: img.height ?? undefined,
	};
}

// Upsert every referenced artist by id. Bumps name + updatedAt on conflict.
async function upsertArtistRows(tx: Tx, refs: ArtistRef[]) {
	const unique = new Map<string, string>();
	for (const a of refs) {
		if (a.id) unique.set(a.id, a.name);
	}
	if (unique.size === 0) return;

	await tx
		.insert(artists)
		.values([...unique].map(([id, name]) => ({ id, name })))
		.onConflictDoUpdate({
			target: artists.id,
			set: { name: sql`excluded.name`, updatedAt: sql`now()` },
		});
}

// Upsert an album row + its images. `totalTracks` is only overwritten when known and
// `complete` is only set when ingesting a full album, so stubs (from artist/track payloads)
// never clobber a fully-ingested album's count or completeness.
async function upsertAlbumRow(
	tx: Tx,
	album: {
		id: string;
		name: string;
		releaseDate: string;
		totalTracks?: number;
		images: ImageRef[];
	},
	opts?: { complete?: boolean },
) {
	const set: Record<string, unknown> = {
		name: sql`excluded.name`,
		releaseDate: sql`excluded.release_date`,
		updatedAt: sql`now()`,
	};
	if (album.totalTracks !== undefined) {
		set.totalTracks = sql`excluded.total_tracks`;
	}
	if (opts?.complete) {
		set.complete = sql`excluded.complete`;
	}

	await tx
		.insert(albums)
		.values({
			id: album.id,
			name: album.name,
			releaseDate: album.releaseDate,
			totalTracks: album.totalTracks ?? 0,
			complete: opts?.complete ?? false,
		})
		.onConflictDoUpdate({ target: albums.id, set });

	await tx.delete(albumImages).where(eq(albumImages.albumId, album.id));
	if (album.images.length > 0) {
		await tx.insert(albumImages).values(
			album.images.map((img) => ({
				albumId: album.id,
				url: img.url,
				width: img.width,
				height: img.height,
			})),
		);
	}
}

// Replace an album's artist links (delete + insert), preserving order via position.
async function setAlbumArtists(tx: Tx, albumId: string, refs: ArtistRef[]) {
	await tx.delete(albumArtists).where(eq(albumArtists.albumId, albumId));
	const seen = new Set<string>();
	const rows = refs
		.filter((a) => a.id && !seen.has(a.id) && seen.add(a.id))
		.map((a, i) => ({ albumId, artistId: a.id, position: i }));
	if (rows.length > 0) await tx.insert(albumArtists).values(rows);
}

// Replace a track's artist links (delete + insert), preserving order via position.
async function setTrackArtists(tx: Tx, trackId: string, refs: ArtistRef[]) {
	await tx.delete(trackArtists).where(eq(trackArtists.trackId, trackId));
	const seen = new Set<string>();
	const rows = refs
		.filter((a) => a.id && !seen.has(a.id) && seen.add(a.id))
		.map((a, i) => ({ trackId, artistId: a.id, position: i }));
	if (rows.length > 0) await tx.insert(trackArtists).values(rows);
}

/**
 * Replicate a full album: its artists, images, artist links, and every track
 * (with each track's artists). FK order: artists → album → tracks → links.
 */
export async function upsertAlbum(album: MusicAlbum): Promise<void> {
	const trackItems = album.tracks.items;
	const allArtists = [
		...album.artists,
		...trackItems.flatMap((t) => t.artists),
	];

	await db.transaction(async (tx) => {
		await upsertArtistRows(tx, allArtists);

		await upsertAlbumRow(
			tx,
			{
				id: album.id,
				name: album.name,
				releaseDate: album.releaseDate,
				totalTracks: album.totalTracks,
				images: album.images,
			},
			{ complete: true },
		);
		await setAlbumArtists(tx, album.id, album.artists);

		const seen = new Set<string>();
		const uniqueTracks = trackItems.filter(
			(t) => t.id && !seen.has(t.id) && seen.add(t.id),
		);
		if (uniqueTracks.length > 0) {
			await tx
				.insert(tracks)
				.values(
					uniqueTracks.map((t) => ({
						id: t.id,
						name: t.name,
						durationMs: t.durationMs,
						trackNumber: t.trackNumber,
						albumId: album.id,
					})),
				)
				.onConflictDoUpdate({
					target: tracks.id,
					set: {
						name: sql`excluded.name`,
						durationMs: sql`excluded.duration_ms`,
						trackNumber: sql`excluded.track_number`,
						albumId: sql`excluded.album_id`,
						updatedAt: sql`now()`,
					},
				});

			for (const t of uniqueTracks) {
				await setTrackArtists(tx, t.id, t.artists);
			}
		}
	});
}

/**
 * Replicate an artist: the artist row, its images, and stub rows for each of its
 * albums (no tracks — the artist payload doesn't carry them).
 */
export async function upsertArtist(artist: MusicArtistDetail): Promise<void> {
	const albumArtistRefs = artist.albums.flatMap((a) => a.artists);

	await db.transaction(async (tx) => {
		await upsertArtistRows(tx, [
			{ id: artist.id, name: artist.name },
			...albumArtistRefs,
		]);

		// Mark the artist complete: this is a full artist-detail fetch, not a stub.
		await tx
			.update(artists)
			.set({ complete: true, updatedAt: sql`now()` })
			.where(eq(artists.id, artist.id));

		await tx.delete(artistImages).where(eq(artistImages.artistId, artist.id));
		if (artist.images.length > 0) {
			await tx.insert(artistImages).values(
				artist.images.map((img) => ({
					artistId: artist.id,
					url: img.url,
					width: img.width,
					height: img.height,
				})),
			);
		}

		for (const album of artist.albums) {
			await upsertAlbumRow(tx, {
				id: album.id,
				name: album.name,
				releaseDate: album.releaseDate,
				images: album.images,
			});
			await setAlbumArtists(tx, album.id, album.artists);
		}
	});
}

/**
 * Replicate a single track: its artists, a stub for its album, and the track row.
 * The track payload carries no album artists or track count, so those stay untouched.
 */
export async function upsertTrack(track: MusicTrack): Promise<void> {
	await db.transaction(async (tx) => {
		await upsertArtistRows(tx, track.artists);

		await upsertAlbumRow(tx, {
			id: track.album.id,
			name: track.album.name,
			releaseDate: track.album.releaseDate,
			images: track.album.images,
		});

		await tx
			.insert(tracks)
			.values({
				id: track.id,
				name: track.name,
				durationMs: track.durationMs,
				trackNumber: track.trackNumber,
				albumId: track.album.id,
			})
			.onConflictDoUpdate({
				target: tracks.id,
				set: {
					name: sql`excluded.name`,
					durationMs: sql`excluded.duration_ms`,
					trackNumber: sql`excluded.track_number`,
					albumId: sql`excluded.album_id`,
					updatedAt: sql`now()`,
				},
			});

		await setTrackArtists(tx, track.id, track.artists);
	});
}

// --- Read side: reconstruct Music* types from the relational replica ---

/** Reassemble a full album (artists, images, tracks) from the replica, or null. */
export async function getAlbumFromDb(id: string): Promise<MusicAlbum | null> {
	const [album] = await db.select().from(albums).where(eq(albums.id, id));
	// Stub rows (created while ingesting an artist/track) are treated as a miss.
	if (!album || !album.complete) return null;

	const [imgs, albumArtistRows, trackRows] = await Promise.all([
		db.select().from(albumImages).where(eq(albumImages.albumId, id)),
		db
			.select({ id: artists.id, name: artists.name })
			.from(albumArtists)
			.innerJoin(artists, eq(albumArtists.artistId, artists.id))
			.where(eq(albumArtists.albumId, id))
			.orderBy(asc(albumArtists.position)),
		db
			.select()
			.from(tracks)
			.where(eq(tracks.albumId, id))
			.orderBy(asc(tracks.trackNumber)),
	]);

	const trackIds = trackRows.map((t) => t.id);
	const taRows = trackIds.length
		? await db
				.select({
					trackId: trackArtists.trackId,
					id: artists.id,
					name: artists.name,
				})
				.from(trackArtists)
				.innerJoin(artists, eq(trackArtists.artistId, artists.id))
				.where(inArray(trackArtists.trackId, trackIds))
				.orderBy(asc(trackArtists.position))
		: [];

	const artistsByTrack = new Map<string, ArtistRef[]>();
	for (const r of taRows) {
		const arr = artistsByTrack.get(r.trackId) ?? [];
		arr.push({ id: r.id, name: r.name });
		artistsByTrack.set(r.trackId, arr);
	}

	return {
		id: album.id,
		name: album.name,
		artists: albumArtistRows,
		images: imgs.map(mapImageRow),
		releaseDate: album.releaseDate,
		type: "album",
		totalTracks: album.totalTracks,
		tracks: {
			total: trackRows.length,
			items: trackRows.map((t) => ({
				id: t.id,
				name: t.name,
				durationMs: t.durationMs,
				trackNumber: t.trackNumber,
				artists: artistsByTrack.get(t.id) ?? [],
				type: "track",
			})),
		},
	};
}

/** Reassemble an artist and its album summaries from the replica, or null. */
export async function getArtistFromDb(
	id: string,
): Promise<MusicArtistDetail | null> {
	const [artist] = await db.select().from(artists).where(eq(artists.id, id));
	// Stub rows (created while ingesting an album/track) are treated as a miss.
	if (!artist || !artist.complete) return null;

	const [imgs, albumLinks] = await Promise.all([
		db.select().from(artistImages).where(eq(artistImages.artistId, id)),
		db
			.select({ albumId: albumArtists.albumId })
			.from(albumArtists)
			.where(eq(albumArtists.artistId, id)),
	]);

	const albumIds = albumLinks.map((l) => l.albumId);
	let albumSummaries: MusicAlbumSummary[] = [];

	if (albumIds.length > 0) {
		const [albumRows, albumImgRows, albumArtistRows] = await Promise.all([
			db
				.select()
				.from(albums)
				.where(inArray(albums.id, albumIds))
				.orderBy(desc(albums.releaseDate)),
			db
				.select()
				.from(albumImages)
				.where(inArray(albumImages.albumId, albumIds)),
			db
				.select({
					albumId: albumArtists.albumId,
					id: artists.id,
					name: artists.name,
				})
				.from(albumArtists)
				.innerJoin(artists, eq(albumArtists.artistId, artists.id))
				.where(inArray(albumArtists.albumId, albumIds))
				.orderBy(asc(albumArtists.position)),
		]);

		const imgsByAlbum = new Map<string, ImageRef[]>();
		for (const img of albumImgRows) {
			const arr = imgsByAlbum.get(img.albumId) ?? [];
			arr.push(mapImageRow(img));
			imgsByAlbum.set(img.albumId, arr);
		}
		const artistsByAlbum = new Map<string, ArtistRef[]>();
		for (const r of albumArtistRows) {
			const arr = artistsByAlbum.get(r.albumId) ?? [];
			arr.push({ id: r.id, name: r.name });
			artistsByAlbum.set(r.albumId, arr);
		}

		albumSummaries = albumRows.map((a) => ({
			id: a.id,
			name: a.name,
			artists: artistsByAlbum.get(a.id) ?? [],
			images: imgsByAlbum.get(a.id) ?? [],
			releaseDate: a.releaseDate,
			type: "album",
		}));
	}

	return {
		id: artist.id,
		name: artist.name,
		images: imgs.map(mapImageRow),
		type: "artist",
		albums: albumSummaries,
	};
}

/** Reassemble a single track and its album from the replica, or null. */
export async function getTrackFromDb(id: string): Promise<MusicTrack | null> {
	const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
	if (!track) return null;

	const [album] = await db
		.select()
		.from(albums)
		.where(eq(albums.id, track.albumId));
	if (!album) return null;

	const [albumImgs, taRows] = await Promise.all([
		db.select().from(albumImages).where(eq(albumImages.albumId, track.albumId)),
		db
			.select({ id: artists.id, name: artists.name })
			.from(trackArtists)
			.innerJoin(artists, eq(trackArtists.artistId, artists.id))
			.where(eq(trackArtists.trackId, id))
			.orderBy(asc(trackArtists.position)),
	]);

	return {
		id: track.id,
		name: track.name,
		durationMs: track.durationMs,
		trackNumber: track.trackNumber,
		artists: taRows,
		type: "track",
		album: {
			id: album.id,
			name: album.name,
			images: albumImgs.map(mapImageRow),
			releaseDate: album.releaseDate,
		},
	};
}
