import { sql } from "drizzle-orm";
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
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

export const likes = pgTable("likes", {
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
});

export const userPlaylists = pgTable("user_playlists", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	isSystem: boolean("is_system").notNull().default(false),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
