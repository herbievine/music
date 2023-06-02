import useSWRImmutable from "swr/immutable";
import * as z from "zod";
import fetcher from "@/lib/fetcher";
import { SongSchema } from "@/schemas/song";
import { useMemo } from "react";
import { removeDuplicates } from "@/lib/removeDuplicates";

const buildUrl = (query: string) => {
  const baseUrl = "https://itunes.apple.com/search";
  const urlParams = new URLSearchParams({
    term: query,
    media: "music",
    entity: "song",
  });

  return `${baseUrl}?${urlParams}`;
};

const ItunesApiSchema = z.object({
  resultCount: z.number(),
  results: z.array(SongSchema),
});

export default function useSong(query?: string | null) {
  const { data } = useSWRImmutable<z.infer<typeof ItunesApiSchema>>(
    query ? buildUrl(query) : null,
    (url) => fetcher<z.infer<typeof ItunesApiSchema>>(url, ItunesApiSchema)
  );

  const cleanData = useMemo(() => {
    if (!data) return null;

    const songs = data.results.filter(
      (val) =>
        !val.trackName.toLowerCase().match(/(edit|remix|version|parody)/g)
    );

    return removeDuplicates(songs, [
      "artistName",
      "trackName",
      "collectionName",
    ]);
  }, [data]);

  return {
    data: cleanData,
  };
}
