PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`bucket_id` text,
	`external_id` text NOT NULL,
	`youtube_video_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_songs`("id", "bucket_id", "external_id", "youtube_video_id", "created_at") SELECT "id", "bucket_id", "external_id", "youtube_video_id", "created_at" FROM `songs`;--> statement-breakpoint
DROP TABLE `songs`;--> statement-breakpoint
ALTER TABLE `__new_songs` RENAME TO `songs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;