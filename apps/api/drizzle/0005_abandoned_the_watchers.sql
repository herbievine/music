ALTER TABLE "albums" ADD COLUMN "complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "artists" ADD COLUMN "complete" boolean DEFAULT false NOT NULL;