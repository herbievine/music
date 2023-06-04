import SongViewer from "@/components/song-viewer";
import { ItunesApiSchema } from "@/schemas/itunes";
import { MediaSong } from "@/types/media";
import { redirect } from "next/navigation";
import { getMediaFromSong } from "@/lib/media";
import fetcher from "@/lib/fetcher";

async function getSong(id: string): Promise<MediaSong | null> {
  const data = await fetcher(
    `https://itunes.apple.com/lookup?id=${id}`,
    ItunesApiSchema
  );

  if (!data) {
    return null;
  }

  for (const result of data.results) {
    if (result.wrapperType === "track") {
      return getMediaFromSong(result);
    }
  }

  return null;
}

type SongProps = {
  searchParams: {
    id: string;
  };
};

export async function generateMetadata({ searchParams: { id } }: SongProps) {
  const song = await getSong(id);

  if (!song) {
    return {
      title: "Music",
      description: "Search for songs and albums.",
    };
  }

  return {
    title: `${song.title}`,
    description: `Playing ${song.title} by ${song.artist}.`,
  };
}

export default async function SongPage({ searchParams: { id } }: SongProps) {
  const song = await getSong(id);

  if (!song) {
    redirect("/");
  }

  return <SongViewer song={song} />;
}
