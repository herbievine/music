import useSWRImmutable from "swr/immutable";
import * as z from "zod";
import fetcher from "@/lib/fetcher";
import { SongSchema } from "@/schemas/song";
import { useMemo } from "react";
import { removeDuplicates } from "@/lib/removeDuplicates";
import { AlbumSchema } from "@/schemas/album";

const buildUrl = (query: string) => {
  const baseUrl = "https://itunes.apple.com/search";
  const urlParams = new URLSearchParams({
    term: query,
    // media: "music",
    entity: "song,album",
  });

  return `${baseUrl}?${urlParams}`;
};

const ItunesApiSchema = z.object({
  resultCount: z.number(),
  results: z.array(z.union([SongSchema, AlbumSchema])),
});

export default function useSearch(query?: string | null) {
  const { data, ...rest } = useSWRImmutable<z.infer<typeof ItunesApiSchema>>(
    query ? buildUrl(query) : null,
    (url) => fetcher<z.infer<typeof ItunesApiSchema>>(url, ItunesApiSchema)
  );

  const cleanData = useMemo(() => {
    if (!data) return null;

    return removeDuplicates(
      data.results.filter((val) =>
        val.wrapperType === "track"
          ? !val.trackName.toLowerCase().match(/(edit|remix|version|parody)/g)
          : !val.collectionName
              .toLowerCase()
              .match(/(edit|remix|version|parody)/g)
      ),
      ["artistName", "collectionName"]
    );
  }, [data]);

  return {
    data: cleanData,
    ...rest,
  };
}
