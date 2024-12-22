import { artists, DrizzleD1Database, eq } from "@music/db";
import { findArtist } from "./itunes";
import { id } from "../utils/id";

export async function getArtist(artistId: string, db: DrizzleD1Database) {
  let artist = await db
    .select()
    .from(artists)
    .where(eq(artists.itunesId, artistId))
    .get();

  if (!artist) {
    const itunesArtist = await findArtist(artistId);

    if (!itunesArtist) {
      throw new Error(`Cannot find artist with ID: ${artistId}`);
    }

    [artist] = await db
      .insert(artists)
      .values({
        id: id(),
        itunesId: itunesArtist.artistId.toString(),
        name: itunesArtist.artistName,
      })
      .returning();
  }

  return artist;
}
