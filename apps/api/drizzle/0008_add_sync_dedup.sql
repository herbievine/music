ALTER TABLE "user_playlists" ADD COLUMN IF NOT EXISTS "spotify_id" text;--> statement-breakpoint
DELETE FROM "likes" a USING "likes" b WHERE a.ctid < b.ctid AND a."user_id" = b."user_id" AND a."item_id" = b."item_id" AND a."item_type" = b."item_type";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "likes_user_item_type_uq" ON "likes" USING btree ("user_id","item_id","item_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_playlists_user_spotify_uq" ON "user_playlists" USING btree ("user_id","spotify_id") WHERE "user_playlists"."spotify_id" is not null;
