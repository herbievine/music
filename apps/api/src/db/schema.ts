import { sql } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const playHistory = pgTable("play_history", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull(),
	trackId: text("track_id").notNull(),
	metadata: jsonb("metadata")
		.$type<{
			name: string;
			artists: { id: string; name: string }[];
			album: {
				id: string;
				name: string;
				images: { url: string; width?: number; height?: number }[];
				releaseDate: string;
			};
			durationMs: number;
		}>()
		.notNull(),
	playedAt: timestamp("played_at").defaultNow().notNull(),
});

export const playClicks = pgTable("play_clicks", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull(),
	contextType: text("context_type").notNull(), // 'album' | 'playlist' | 'track'
	contextId: text("context_id").notNull(),
	metadata: jsonb("metadata")
		.$type<{
			name: string;
			images: { url: string; width?: number; height?: number }[];
			artists?: { id: string; name: string }[];
			description?: string;
			releaseDate?: string;
			durationMs?: number;
			album?: {
				id: string;
				name: string;
				images: { url: string; width?: number; height?: number }[];
				releaseDate: string;
			};
		}>()
		.notNull(),
	clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});

export const likes = pgTable(
	"likes",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id").notNull(),
		itemId: text("item_id").notNull(),
		itemType: text("item_type").notNull(),
		metadata: jsonb("metadata")
			.$type<{
				name: string;
				image: string;
				artist: string;
			}>()
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		// One like per (user, item); makes imports idempotent under concurrent writes.
		userItemUnique: uniqueIndex("likes_user_item_type_uq").on(
			table.userId,
			table.itemId,
			table.itemType,
		),
	}),
);

export const userPlaylists = pgTable(
	"user_playlists",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		// Set when the playlist was imported from Spotify; null for app-created playlists.
		// Used to dedupe imports so an already-imported playlist isn't re-synced.
		spotifyId: text("spotify_id"),
		isSystem: boolean("is_system").notNull().default(false),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		// At most one imported playlist per (user, Spotify playlist). Partial so
		// app-created playlists (null spotify_id) are unconstrained.
		spotifyUnique: uniqueIndex("user_playlists_user_spotify_uq")
			.on(table.userId, table.spotifyId)
			.where(sql`${table.spotifyId} is not null`),
	}),
);

export const userPlaylistTracks = pgTable("user_playlist_tracks", {
	id: uuid("id").defaultRandom().primaryKey(),
	playlistId: uuid("playlist_id")
		.notNull()
		.references(() => userPlaylists.id, { onDelete: "cascade" }),
	trackId: text("track_id").notNull(),
	trackMetadata: jsonb("track_metadata")
		.$type<{
			name: string;
			artists: string[];
			albumName: string;
			albumImage: string;
			durationMs: number;
		}>()
		.notNull(),
	position: integer("position").notNull().default(0),
	addedAt: timestamp("added_at").defaultNow().notNull(),
});

// --- Spotify data replication ---
// Local replica of Spotify entities, populated when users visit them.
// Spotify IDs are the primary keys. `updatedAt` is our ingestion timestamp.

export const artists = pgTable("artists", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	// Spotify puts genres on the artist (not the album); populated from full fetches.
	genres: text("genres")
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
	// true once written from a full artist-detail fetch, false for side-effect stubs.
	complete: boolean("complete").notNull().default(false),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	// Cached "This Is <Artist>" playlist lookup (resolved via undocumented pathfinder
	// API). Null value + non-null checkedAt means "checked, artist has none" — distinct
	// from "never checked" (checkedAt null), so we don't keep re-querying forever.
	thisIsPlaylist: jsonb("this_is_playlist").$type<{
		id: string;
		name: string;
		description: string;
		images: { url: string; width?: number; height?: number }[];
	} | null>(),
	thisIsPlaylistCheckedAt: timestamp("this_is_playlist_checked_at"),
});

export const artistImages = pgTable("artist_images", {
	id: uuid("id").defaultRandom().primaryKey(),
	artistId: text("artist_id")
		.notNull()
		.references(() => artists.id, { onDelete: "cascade" }),
	url: text("url").notNull(),
	width: integer("width"),
	height: integer("height"),
});

export const albums = pgTable("albums", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	releaseDate: text("release_date").notNull(),
	totalTracks: integer("total_tracks").notNull(),
	// true once written from a full album fetch (with tracks), false for side-effect stubs.
	complete: boolean("complete").notNull().default(false),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const albumImages = pgTable("album_images", {
	id: uuid("id").defaultRandom().primaryKey(),
	albumId: text("album_id")
		.notNull()
		.references(() => albums.id, { onDelete: "cascade" }),
	url: text("url").notNull(),
	width: integer("width"),
	height: integer("height"),
});

export const albumArtists = pgTable(
	"album_artists",
	{
		albumId: text("album_id")
			.notNull()
			.references(() => albums.id, { onDelete: "cascade" }),
		artistId: text("artist_id")
			.notNull()
			.references(() => artists.id, { onDelete: "cascade" }),
		position: integer("position").notNull().default(0),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.albumId, table.artistId] }),
	}),
);

export const tracks = pgTable("tracks", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	durationMs: integer("duration_ms").notNull(),
	trackNumber: integer("track_number").notNull(),
	albumId: text("album_id")
		.notNull()
		.references(() => albums.id, { onDelete: "cascade" }),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trackArtists = pgTable(
	"track_artists",
	{
		trackId: text("track_id")
			.notNull()
			.references(() => tracks.id, { onDelete: "cascade" }),
		artistId: text("artist_id")
			.notNull()
			.references(() => artists.id, { onDelete: "cascade" }),
		position: integer("position").notNull().default(0),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.trackId, table.artistId] }),
	}),
);
