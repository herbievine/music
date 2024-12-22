import { albums, DrizzleD1Database, eq } from "@music/db";
import { findAlbum } from "./itunes";
import { getArrayBuffer } from "../utils/get-array-buffer";
import { getContext } from "hono/context-storage";
import { id } from "../utils/id";

export async function getAlbum(albumId: string, db: DrizzleD1Database) {
  let album = await db
    .select()
    .from(albums)
    .where(eq(albums.itunesId, albumId))
    .get();

  if (!album) {
    const itunesAlbum = await findAlbum(albumId);

    if (!itunesAlbum) {
      throw new Error(`Cannot find album with ID: ${albumId}`);
    }

    const arrayBuffer = await getArrayBuffer(
      itunesAlbum.artworkUrl100.replace("100x100", "600x600"),
    );

    const { key } = await getContext<{ Bindings: Env }>().env.ALBUM_COVERS.put(
      id(),
      arrayBuffer,
      {
        httpMetadata: { contentType: "audio/jpeg" },
      },
    );

    [album] = await db
      .insert(albums)
      .values({
        id: id(),
        bucketCoverId: key,
        itunesId: itunesAlbum.collectionId.toString(),
        itunesArtistId: itunesAlbum.artistId.toString(),
        name: itunesAlbum.collectionName,
        ...itunesAlbum,
      })
      .returning();
  }

  return album;
}
