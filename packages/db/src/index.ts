import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export * from "drizzle-orm";
export * from "drizzle-orm/d1";

export const songs = sqliteTable("songs", {
  id: text("id").primaryKey(),

  bucketId: text("bucket_id"),

  itunesId: text("itunes_id").notNull(),
  itunesArtistId: text("itunes_artist_id").notNull(),
  itunesAlbumId: text("itunes_album_id").notNull(),

  name: text("name").notNull(),
  releaseDate: text("release_date").notNull(),
  discCount: int("disc_count").notNull(),
  discNumber: int("disc_number").notNull(),
  trackCount: int("track_count").notNull(),
  trackNumber: int("track_number").notNull(),
  trackTimeMillis: int("track_nime_millis").notNull(),
  primaryGenreName: text("primary_genre_name").notNull(),

  artworkUrl30: text("artwork_url_30").notNull(),
  artworkUrl60: text("artwork_url_60").notNull(),
  artworkUrl100: text("artwork_url_100").notNull(),

  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const albums = sqliteTable("albums", {
  id: text("id").primaryKey(),

  bucketCoverId: text("bucket_cover_id").notNull(),

  itunesId: text("itunes_id").notNull(),
  itunesArtistId: text("itunes_artist_id").notNull(),

  name: text("name").notNull(),
  releaseDate: text("release_date").notNull(),
  trackCount: int("track_count").notNull(),
  primaryGenreName: text("primary_genre_name").notNull(),

  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const artists = sqliteTable("artists", {
  id: text("id").primaryKey(),

  itunesId: text("itunes_id").notNull(),

  name: text("name").notNull(),

  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
