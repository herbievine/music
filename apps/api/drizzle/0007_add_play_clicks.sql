CREATE TABLE IF NOT EXISTS "play_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"context_type" text NOT NULL,
	"context_id" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
