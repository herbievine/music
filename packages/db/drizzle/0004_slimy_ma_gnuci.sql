CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`itunes_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
