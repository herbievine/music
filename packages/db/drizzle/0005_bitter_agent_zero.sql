PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`bucket_id` text,
	`itunes_id` text NOT NULL,
	`itunes_artist_id` text NOT NULL,
	`itunes_album_id` text NOT NULL,
	`name` text NOT NULL,
	`release_date` text NOT NULL,
	`disc_count` integer NOT NULL,
	`disc_number` integer NOT NULL,
	`track_count` integer NOT NULL,
	`track_number` integer NOT NULL,
	`track_nime_millis` integer NOT NULL,
	`primary_genre_name` text NOT NULL,
	`artwork_url_30` text NOT NULL,
	`artwork_url_60` text NOT NULL,
	`artwork_url_100` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_songs`("id", "bucket_id", "itunes_id", "itunes_artist_id", "itunes_album_id", "name", "release_date", "disc_count", "disc_number", "track_count", "track_number", "track_nime_millis", "primary_genre_name", "artwork_url_30", "artwork_url_60", "artwork_url_100", "created_at") SELECT "id", "bucket_id", "itunes_id", "itunes_artist_id", "itunes_album_id", "name", "release_date", "disc_count", "disc_number", "track_count", "track_number", "track_nime_millis", "primary_genre_name", "artwork_url_30", "artwork_url_60", "artwork_url_100", "created_at" FROM `songs`;--> statement-breakpoint
DROP TABLE `songs`;--> statement-breakpoint
ALTER TABLE `__new_songs` RENAME TO `songs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;