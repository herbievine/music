import { songs, DrizzleD1Database, eq } from "@music/db";
import { findSong } from "./itunes";
import { id } from "../utils/id";
import { youtube } from "../api/youtube";
import { getContext } from "hono/context-storage";
import { converter } from "../api/converter";
import { getArrayBuffer } from "../utils/get-array-buffer";
import { write2 } from "../lib/id3";
import { getAlbum } from "./albums";
import { getArtist } from "./artists";

export async function getSong(songId: string, db: DrizzleD1Database) {
  let song = await db
    .select()
    .from(songs)
    .where(eq(songs.itunesId, songId))
    .get();

  if (!song) {
    const itunesSong = await findSong(songId);

    if (!itunesSong) {
      throw new Error(`Cannot find song with ID: ${songId}`);
    }

    [song] = await db
      .insert(songs)
      .values({
        id: id(),
        bucketId: null,
        itunesId: itunesSong.trackId.toString(),
        itunesAlbumId: itunesSong.collectionId.toString(),
        itunesArtistId: itunesSong.artistId.toString(),
        name: itunesSong.trackName,
        ...itunesSong,
      })
      .returning();
  }

  const album = await getAlbum(song.itunesAlbumId, db);
  const artist = await getArtist(song.itunesArtistId, db);

  return {
    ...song,
    album,
    artist,
  };
}

export async function saveSong(songId: string, db: DrizzleD1Database) {
  const song = await getSong(songId, db);

  if (song.bucketId) {
    return `https://audio.herbievine.com/${song.bucketId}`;
  }

  const album = await getAlbum(song.itunesAlbumId, db);
  const artist = await getArtist(song.itunesArtistId, db);

  const {
    items: [video],
  } = await youtube(
    `${artist.name} ${song.name} audio`,
    getContext<{ Bindings: Env }>().env.YOUTUBE_API_KEY,
  );

  const link = await converter(
    video.id.videoId,
    getContext<{ Bindings: Env }>().env.CONVERTER_API_KEY,
  );

  const arrayBuffer = await getArrayBuffer(link, {
    headers: {
      "content-type": "audio/mpeg",
    },
  });

  const songWithTags = await write2({ ...song, artist, album }, arrayBuffer);

  const { key } = await getContext<{ Bindings: Env }>().env.AUDIO.put(
    id(),
    songWithTags,
    {
      httpMetadata: { contentType: "audio/mpeg" },
    },
  );

  const [{ bucketId }] = await db
    .update(songs)
    .set({
      bucketId: key,
    })
    .where(eq(songs.id, song.id))
    .returning({
      bucketId: songs.bucketId,
    });

  return `https://audio.herbievine.com/${bucketId}`;
}
