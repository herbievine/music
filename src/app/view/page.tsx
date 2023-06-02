import AlbumViewer from "@/components/album-viewer";
import SongViewer from "@/components/song-viewer";
import { Album } from "@/schemas/album";
import { ItunesApiSchema } from "@/schemas/itunes";
import { Song } from "@/schemas/song";
import { redirect } from "next/navigation";

async function getSongs(id: string): Promise<
  | {
      type: "song";
      song: Song;
    }
  | {
      type: "album";
      album: Album;
      songs: Song[];
    }
  | null
> {
  const data = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
  const { results } = await ItunesApiSchema.parseAsync(await data.json());

  if (results.length === 0) {
    return null;
  } else if (results[0].wrapperType === "track") {
    return {
      type: "song",
      song: results[0],
    };
  }

  const albumSongsData = await fetch(
    `https://itunes.apple.com/lookup?id=${id}&entity=song`
  );
  const { results: albumSongs } = await ItunesApiSchema.parseAsync(
    await albumSongsData.json()
  );

  return {
    type: "album",
    album: results[0],
    songs: (albumSongs as Song[]).filter(
      (song) => song.wrapperType === "track"
    ),
  };
}

type SongProps = {
  searchParams: {
    id: string;
  };
};

export default async function SongPage({ searchParams: { id } }: SongProps) {
  const data = await getSongs(id);

  if (!data) {
    redirect("/");
  }

  if (data.type === "song") {
    return <SongViewer song={data.song} />;
  }

  return <AlbumViewer album={data.album} songs={data.songs} />;
}
