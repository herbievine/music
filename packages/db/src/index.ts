import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export * from "drizzle-orm";
export * from "drizzle-orm/d1";

export const songs = sqliteTable("songs", {
	id: text("id").primaryKey(),
	bucketId: text("bucket_id").notNull(),
	externalId: text("external_id").notNull(),
	createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});
