PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_albums` (
	`id` text PRIMARY KEY NOT NULL,
	`bucket_cover_id` text NOT NULL,
	`itunes_id` text,
	`itunes_artist_id` text,
	`external_id` text,
	`external_artist_id` text,
	`name` text NOT NULL,
	`converted` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_albums`("id", "bucket_cover_id", "itunes_id", "itunes_artist_id", "external_id", "external_artist_id", "name", "converted", "created_at") SELECT "id", "bucket_cover_id", "itunes_id", "itunes_artist_id", "external_id", "external_artist_id", "name", "converted", "created_at" FROM `albums`;--> statement-breakpoint
DROP TABLE `albums`;--> statement-breakpoint
ALTER TABLE `__new_albums` RENAME TO `albums`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_artists` (
	`id` text PRIMARY KEY NOT NULL,
	`itunes_id` text,
	`name` text NOT NULL,
	`external_id` text,
	`converted` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_artists`("id", "itunes_id", "name", "external_id", "converted", "created_at") SELECT "id", "itunes_id", "name", "external_id", "converted", "created_at" FROM `artists`;--> statement-breakpoint
DROP TABLE `artists`;--> statement-breakpoint
ALTER TABLE `__new_artists` RENAME TO `artists`;--> statement-breakpoint
CREATE TABLE `__new_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`bucket_id` text,
	`itunes_id` text,
	`itunes_artist_id` text,
	`itunes_album_id` text,
	`external_id` text,
	`external_artist_id` text,
	`external_album_id` text,
	`name` text NOT NULL,
	`converted` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_songs`("id", "bucket_id", "itunes_id", "itunes_artist_id", "itunes_album_id", "external_id", "external_artist_id", "external_album_id", "name", "converted", "created_at") SELECT "id", "bucket_id", "itunes_id", "itunes_artist_id", "itunes_album_id", "external_id", "external_artist_id", "external_album_id", "name", "converted", "created_at" FROM `songs`;--> statement-breakpoint
DROP TABLE `songs`;--> statement-breakpoint
ALTER TABLE `__new_songs` RENAME TO `songs`;