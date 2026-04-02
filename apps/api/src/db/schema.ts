import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const likes = pgTable("likes", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull(),
	itemId: text("item_id").notNull(),
	itemType: text("item_type").notNull(),
	metadata: jsonb("metadata")
		.$type<{
			name: string;
			image: string;
			artist: string;
		}>()
		.notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
