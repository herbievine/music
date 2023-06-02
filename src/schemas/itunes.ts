import { z } from "zod";
import { AlbumSchema } from "@/schemas/album";
import { SongSchema } from "@/schemas/song";

export const ItunesApiSchema = z.object({
  resultCount: z.number(),
  results: z.array(z.union([SongSchema, AlbumSchema])),
});
