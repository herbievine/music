import { albums, artists, type InferSelectModel, songs } from "@music/db";
import { appRouter } from "./index";

export type AppRouter = typeof appRouter;
export type Song = InferSelectModel<typeof songs>;
export type Album = InferSelectModel<typeof albums>;
export type Artist = InferSelectModel<typeof artists>;
