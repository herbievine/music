import { z } from "zod";

export const AlbumSchema = z.object({
  wrapperType: z.literal("collection"),
  collectionType: z.string(),
  artistId: z.number(),
  collectionId: z.number(),
  amgArtistId: z.number(),
  artistName: z.string(),
  collectionName: z.string(),
  collectionCensoredName: z.string(),
  artistViewUrl: z.string(),
  collectionViewUrl: z.string(),
  artworkUrl60: z.string(),
  artworkUrl100: z.string(),
  collectionPrice: z.number(),
  collectionExplicitness: z.union([
    z.literal("explicit"),
    z.literal("notExplicit"),
  ]),
  trackCount: z.number(),
  country: z.string(),
  currency: z.string(),
  releaseDate: z.string(),
  primaryGenreName: z.string(),
});

export type Album = z.infer<typeof AlbumSchema>;
