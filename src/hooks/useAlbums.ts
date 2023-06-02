import useSWRImmutable from "swr/immutable";
import * as z from "zod";
import fetcher from "@/lib/fetcher";
import { useMemo } from "react";
import { removeDuplicates } from "@/lib/removeDuplicates";
import { AlbumSchema } from "@/schemas/album";

const buildUrl = (query: string) => {
  const baseUrl = "https://itunes.apple.com/search";
  const urlParams = new URLSearchParams({
    term: query,
    media: "music",
    entity: "album",
  });

  return `${baseUrl}?${urlParams}`;
};

const ItunesApiSchema = z.object({
  resultCount: z.number(),
  results: z.array(AlbumSchema),
});

export default function useAlbums(query?: string | null) {
  const { data } = useSWRImmutable<z.infer<typeof ItunesApiSchema>>(
    query ? buildUrl(query) : null,
    (url) => fetcher<z.infer<typeof ItunesApiSchema>>(url)
  );

  const cleanData = useMemo(() => {
    if (!data) return null;

    const albums = data.results.filter(
      (val) =>
        !val.collectionName.toLowerCase().match(/(edit|remix|version|parody)/g)
    );

    return removeDuplicates(albums, ["collectionName", "artistName"]);
  }, [data]);

  console.log(data, cleanData);

  return {
    data: cleanData,
  };
}
