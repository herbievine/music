import { z } from "zod";

export const SongSchema = z.object({
  wrapperType: z.literal("track"),
  artistId: z.number(),
  collectionId: z.number(),
  trackId: z.number(),
  artistName: z.string(),
  collectionName: z.string(),
  trackName: z.string(),
  previewUrl: z.string(),
  artworkUrl30: z.string(),
  artworkUrl60: z.string(),
  artworkUrl100: z.string(),
  releaseDate: z.string(),
  collectionExplicitness: z.string(),
  trackExplicitness: z.string(),
  discCount: z.number(),
  discNumber: z.number(),
  trackCount: z.number(),
  trackNumber: z.number(),
  trackTimeMillis: z.number(),
  primaryGenreName: z.string(),
  isStreamable: z.boolean(),
});

export type Song = z.infer<typeof SongSchema>;
