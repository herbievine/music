import { Hono } from "hono";
import {
  Album,
  Artist,
  itunes,
  itunesFindAlbums,
  itunesFindSongs,
  itunesLookup,
  Song,
} from "./api/itunes";
import { youtube } from "./api/youtube";
import { converter } from "./api/converter";
import {
  albums,
  artists,
  songs,
  eq,
  drizzle,
  arrayContains,
  inArray,
} from "@music/db";
import { id } from "./utils/id";
import { getArrayBuffer } from "./utils/get-array-buffer";
import { write } from "./lib/id3";
import archiver from "archiver";
import { Readable } from "stream";
import { cors } from "hono/cors";
import { initTRPC } from "@trpc/server";
import { trpcServer } from "@hono/trpc-server";
import { z } from "zod";
import { contextStorage } from "hono/context-storage";
import { getSong, saveSong } from "./services/songs";
import { getAlbum } from "./services/albums";
import { getArtist } from "./services/artists";

const app = new Hono<{ Bindings: Env }>();

app.use(contextStorage());

type HonoContext = {
  env: Env;
};

app.use(
  cors({
    // origin: [
    //   "https://music.herbievine.com",
    //   "https://winamp.herbievine.com",
    //   "http://localhost:3001",
    // ],
    origin: (o) => o,
  }),
);

const t = initTRPC.context<HonoContext>().create();

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  search: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    if (input.length === 0) {
      return [];
    }

    const { results } = await itunes(input);

    // const itunesIds = results
    //   .filter(
    //     ({ wrapperType }) =>
    //       wrapperType === "collection" || wrapperType === "track",
    //   )
    //   .map((res) =>
    //     res.wrapperType === "track"
    //       ? [res.trackId.toString(), res.collectionId.toString()]
    //       : res.wrapperType === "collection"
    //         ? res.collectionId.toString()
    //         : res.artistId.toString(),
    //   )
    //   .flatMap((r) => r)
    //   .splice(0, 100);

    // console.log(JSON.stringify(itunesIds, null, 2));

    // const db = drizzle(ctx.env.DB);
    // const songsInDb = await db
    //   .select()
    //   .from(songs)
    //   .where(inArray(songs.itunesId, itunesIds))
    //   .all();

    // const albumsInDb = await db
    //   .select()
    //   .from(albums)
    //   .where(inArray(albums.itunesId, itunesIds))
    //   .all();

    // console.log(JSON.stringify({ songsInDb, albumsInDb, itunesIds }, null, 2));

    return results
      .filter(
        ({ wrapperType }) =>
          wrapperType === "collection" || wrapperType === "track",
      )
      .map((data) => {
        data = data as Song | Album;

        if (data.wrapperType === "track") {
          return {
            albumId: data.collectionId,
            object: "song",
            name: data.trackName,
            url: data.artworkUrl100, //.replace("100x100", "1000x1000"),
            releaseYear: data.releaseDate.split("-")[0],
            trackCount: data.trackCount,
          };
        } else {
          return {
            albumId: data.collectionId,
            object: "album",
            name: data.collectionName,
            url: data.artworkUrl100, //.replace("100x100", "1000x1000"),
            releaseYear: data.releaseDate.split("-")[0],
            trackCount: data.trackCount,
          };
        }
      });
  }),
  getAlbumById: publicProcedure
    .input(z.object({ albumId: z.string() }))
    .query(async ({ input: { albumId }, ctx }) => {
      const db = drizzle(ctx.env.DB);
      const album = await getAlbum(albumId, db);

      if (!album) {
        return null;
      }

      const artist = await getArtist(album.itunesArtistId, db);

      return {
        ...album,
        artist,
      };
    }),
  getAlbumTracks: publicProcedure
    .input(z.string().min(1))
    .query(async ({ input, ctx }) => {
      const { results } = await itunesLookup(input, "song");

      if (results.length === 0) {
        return null;
      }

      const songs = results.filter(
        ({ wrapperType }) => wrapperType === "track",
      ) as Song[];

      const db = drizzle(ctx.env.DB);

      return Promise.all(
        songs.map(({ trackId }) => getSong(trackId.toString(), db)),
      );
    }),
  play: publicProcedure
    .input(
      z.object({
        songId: z.string(),
      }),
    )
    .query(async ({ input: { songId }, ctx }) => {
      const db = drizzle(ctx.env.DB);
      return saveSong(songId, db);
    }),
});

export type AppRouter = typeof appRouter;
export type { Album, Artist, Song } from "./api/itunes";

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  }),
);

app.get("/search", async (c) => {
  const q = c.req.query("q") || "";

  if (q.length === 0) {
    return c.json([]);
  }

  const { results } = await itunes(q);

  return c.json(
    results
      .filter(({ wrapperType }) => wrapperType === "collection")
      .map((album) => {
        const {
          collectionId,
          collectionName,
          artworkUrl100,
          trackCount,
          releaseDate,
        } = album as Album;

        return {
          albumId: collectionId,
          name: collectionName,
          url: artworkUrl100, //.replace("100x100", "1000x1000"),
          releaseYear: releaseDate.split("-")[0],
          trackCount,
        };
      }),
  );
});

app.get("/album/save/:itunesId", async (c) => {
  const itunesId = c.req.param("itunesId");

  const db = drizzle(c.env.DB);
  const album = await db
    .select()
    .from(albums)
    .where(eq(albums.itunesId, itunesId))
    .get();

  if (album) {
    return c.json(album);
  }

  const {
    results: [data],
  } = await itunesFindAlbums(itunesId);

  if (data.wrapperType !== "collection") {
    return c.json({ message: "iTunes ID was not an album" }, 400);
  }

  const arrayBuffer = await getArrayBuffer(
    data.artworkUrl100.replace("100x100", "1000x1000"),
  );

  const { key } = await c.env.ALBUM_COVERS.put(id(), arrayBuffer, {
    httpMetadata: { contentType: "audio/jpeg" },
  });

  return c.json(
    await db
      .insert(albums)
      .values({
        id: id(),
        bucketCoverId: key,
        itunesId: data.collectionId.toString(),
        itunesArtistId: data.artistId.toString(),
        name: data.collectionName,
        ...data,
      })
      .returning(),
  );
});

app.get("/play/:id", async (c) => {
  const itunesId = c.req.param("id");

  const db = drizzle(c.env.DB);
  const existingSong = await db
    .select()
    .from(songs)
    .where(eq(songs.itunesId, itunesId))
    .get();

  if (existingSong) {
    return c.json({
      url: `https://audio.herbievine.com/${existingSong.id}`,
    });
  }

  const { results } = await itunes(itunesId);

  const song = results[0];

  if (song.wrapperType !== "track") {
    return c.json({ error: "Can't play an album" }, 400);
  }

  const {
    items: [video],
  } = await youtube(
    `${song.artistName} ${song.trackName} audio`,
    c.env.YOUTUBE_API_KEY,
  );

  const link = await converter(video.id.videoId, c.env.CONVERTER_API_KEY);

  const arrayBuffer = await getArrayBuffer(link, {
    headers: {
      "content-type": "audio/mpeg",
    },
  });

  const songWithTags = await write(song, arrayBuffer);

  const { key } = await c.env.AUDIO.put(id(), songWithTags, {
    httpMetadata: { contentType: "audio/mpeg" },
  });

  await db
    .insert(songs)
    .values({
      id: id(),
      bucketId: key,
      itunesId: song.trackId.toString(),
      itunesAlbumId: song.collectionId.toString(),
      itunesArtistId: song.artistId.toString(),
      name: song.trackName,
      ...song,
    })
    .returning();

  return c.json({
    url: `https://audio.herbievine.com/${key}`,
  });
});

app.get("/save/:id", async (c) => {
  const albumId = c.req.param("id");

  const db = drizzle(c.env.DB);
  let album = await db
    .select()
    .from(albums)
    .where(eq(albums.itunesId, albumId))
    .get();

  if (!album) {
    const {
      results: [data],
    } = await itunesFindAlbums(albumId);

    if (data.wrapperType !== "collection") {
      return;
    }

    const arrayBuffer = await getArrayBuffer(
      data.artworkUrl100.replace("100x100", "1000x1000"),
    );

    const { key } = await c.env.ALBUM_COVERS.put(id(), arrayBuffer, {
      httpMetadata: { contentType: "audio/jpeg" },
    });

    [album] = await db
      .insert(albums)
      .values({
        id: id(),
        bucketCoverId: key,
        itunesId: data.collectionId.toString(),
        itunesArtistId: data.artistId.toString(),
        name: data.collectionName,
        ...data,
      })
      .returning();
  }

  console.log("Album:", album.name);

  let artist = await db
    .select()
    .from(artists)
    .where(eq(artists.itunesId, album.itunesArtistId))
    .get();

  if (!artist) {
    const {
      results: [data],
    } = await itunesLookup(album.itunesArtistId);

    if (data.wrapperType !== "artist") {
      return;
    }

    [artist] = await db
      .insert(artists)
      .values({
        id: id(),
        itunesId: data.artistId.toString(),
        name: data.artistName,
        ...data,
      })
      .returning();
  }

  console.log("Artist:", artist.name);

  const { results } = await itunesFindSongs(album.itunesId);

  for (const song of results) {
    if (song.wrapperType !== "track") {
      continue;
    }

    const existingSong = await db
      .select()
      .from(songs)
      .where(eq(songs.itunesId, song.trackId.toString()))
      .get();

    if (existingSong) {
      continue;
    }

    console.log("Processing song:", song.trackName);

    const {
      items: [video],
    } = await youtube(
      `${song.artistName} ${song.trackName} audio`,
      c.env.YOUTUBE_API_KEY,
    );

    const link = await converter(video.id.videoId, c.env.CONVERTER_API_KEY);

    const arrayBuffer = await getArrayBuffer(link, {
      headers: {
        "content-type": "audio/mpeg",
      },
    });

    const songWithTags = await write(
      {
        ...song,
        artistName: artist.name,
        collectionName: album.name,
      },
      arrayBuffer,
    );

    const { key } = await c.env.AUDIO.put(id(), songWithTags, {
      httpMetadata: { contentType: "audio/mpeg" },
    });

    await db
      .insert(songs)
      .values({
        id: id(),
        bucketId: key,
        itunesId: song.trackId.toString(),
        itunesAlbumId: song.collectionId.toString(),
        itunesArtistId: song.artistId.toString(),
        name: song.trackName,
        ...song,
      })
      .returning();

    console.log("Processed song:", song.trackName);
  }

  return c.json({
    ok: true,
    next: `https://music__k7.herbievine.com/download/${album.id}`,
  });
});

app.get("/album/:id", async (c) => {
  const albumId = c.req.param("id");

  const db = drizzle(c.env.DB);
  const album = await db
    .select()
    .from(albums)
    .where(eq(albums.itunesId, albumId))
    .get();

  if (!album) {
    return c.json({
      message: "Please save this album first",
    });
  }

  const artist = await db
    .select()
    .from(artists)
    .where(eq(artists.itunesId, album.itunesArtistId))
    .get();

  if (!artist) {
    return c.json({
      message: "No artist. Please save this album first",
    });
  }

  const results = await db
    .select()
    .from(songs)
    .where(eq(songs.itunesAlbumId, album.itunesId.toString()))
    .all();

  const archive = archiver("zip", { zlib: { level: 9 } });

  for (const song of results) {
    console.log("Processing song:", song.name);

    const arrayBuffer = await getArrayBuffer(
      `https://audio.herbievine.com/${song.bucketId}`,
      {
        headers: {
          "content-type": "audio/mpeg",
        },
      },
    );

    const {
      results: [itunesSong],
    } = await itunesFindSongs(song.itunesId);

    if (itunesSong.wrapperType !== "track") {
      throw "Received a collection/artist instead of a track";
    }

    archive.append(
      await write(
        {
          ...itunesSong,
          collectionName: album.name,
          artistName: artist.name,
        },
        arrayBuffer,
      ),
      {
        name: `${itunesSong.artistName} - ${itunesSong.trackName}.mp3`,
      },
    );

    console.log(
      `Zipped: ${song.name} (${song.trackNumber}/${song.trackCount})`,
    );

    continue;
  }

  archive.finalize();

  return c.body(Readable.toWeb(archive) as unknown as ReadableStream);
});

app.get("/download/album/:id", async (c) => {
  const albumId = c.req.param("id");

  const db = drizzle(c.env.DB);
  const album = await db
    .select()
    .from(albums)
    .where(eq(albums.itunesId, albumId))
    .get();

  if (!album) {
    return c.json({
      message: "Please save this album first",
    });
  }

  const artist = await db
    .select()
    .from(artists)
    .where(eq(artists.itunesId, album.itunesArtistId))
    .get();

  if (!artist) {
    return c.json({
      message: "No artist. Please save this album first",
    });
  }

  const albumSongs = await db
    .select()
    .from(songs)
    .where(eq(songs.itunesAlbumId, album.itunesId.toString()))
    .all();

  return c.body({
    album,
    artist,
    songs: albumSongs,
  });
});

export default app;
