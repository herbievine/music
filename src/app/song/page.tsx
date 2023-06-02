import SongViewer from "@/components/song-viewer";
import { getItunesApiSchema } from "@/schemas/itunes";
import { SongSchema } from "@/schemas/song";

async function getSong(trackId: string) {
  const schema = getItunesApiSchema(SongSchema);
  const data = await fetch(`https://itunes.apple.com/lookup?id=${trackId}`);
  const { results } = await schema.parseAsync(await data.json());

  return results[0];
}

type SongProps = {
  searchParams: {
    trackId: string;
  };
};

export default async function SongPage({
  searchParams: { trackId },
}: SongProps) {
  const song = await getSong(trackId);

  return <SongViewer song={song} />;
}
