CREATE TABLE `albums` (
	`id` text PRIMARY KEY NOT NULL,
	`bucket_cover_id` text NOT NULL,
	`itunes_id` text NOT NULL,
	`itunes_artist_id` text NOT NULL,
	`name` text NOT NULL,
	`release_date` text NOT NULL,
	`track_count` integer NOT NULL,
	`primary_genre_name` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
