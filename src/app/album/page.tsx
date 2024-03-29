import AlbumViewer from "@/components/album-viewer";
import fetcher from "@/lib/fetcher";
import { getMediaFromAlbum, getMediaFromSong } from "@/lib/media";
import { ItunesApiSchema } from "@/schemas/itunes";
import { SongSchema } from "@/schemas/song";
import { MediaAlbum } from "@/types/media";
import { redirect } from "next/navigation";
import { z } from "zod";

async function getAlbum(id: string): Promise<MediaAlbum | null> {
  const albumData = await fetcher(
    `https://itunes.apple.com/lookup?id=${id}`,
    ItunesApiSchema
  );

  if (!albumData) {
    return null;
  }

  const {
    results: [album],
  } = albumData;

  if (!album || album.wrapperType !== "collection") {
    return null;
  }

  const songData = await fetcher(
    `https://itunes.apple.com/lookup?id=${id}&entity=song`,
    ItunesApiSchema
  );

  if (!songData) {
    return null;
  }

  const songs = z
    .array(SongSchema)
    .parse(songData.results.filter((song) => song.wrapperType === "track"))
    .map(getMediaFromSong);

  return {
    ...getMediaFromAlbum(album),
    songs,
  };
}

type SongProps = {
  searchParams: {
    id: string;
  };
};

export async function generateMetadata({ searchParams: { id } }: SongProps) {
  const album = await getAlbum(id);

  if (!album) {
    return {
      title: "Music",
      description: "Search for songs and albums.",
    };
  }

  return {
    title: `${album.title}`,
    description: `Playing ${album.title} by ${album.artist}.`,
  };
}

export default async function SongPage({ searchParams: { id } }: SongProps) {
  const album = await getAlbum(id);

  if (!album) {
    redirect("/");
  }

  return <AlbumViewer album={album} />;
}
