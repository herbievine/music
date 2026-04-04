import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
