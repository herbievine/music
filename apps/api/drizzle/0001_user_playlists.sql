CREATE TABLE IF NOT EXISTS "user_playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_playlist_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlist_id" uuid NOT NULL REFERENCES "user_playlists"("id") ON DELETE CASCADE,
	"track_id" text NOT NULL,
	"track_metadata" jsonb NOT NULL,
	"position" integer NOT NULL DEFAULT 0,
	"added_at" timestamp DEFAULT now() NOT NULL
);
