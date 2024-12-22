CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
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
