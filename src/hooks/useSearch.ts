import useSWRImmutable from "swr/immutable";
import * as z from "zod";
import fetcher from "@/lib/fetcher";
import { SongSchema } from "@/schemas/song";
import { AlbumSchema } from "@/schemas/album";
import { getMediaFromSongOrAlbum } from "@/lib/media";
import { removeDuplicates } from "@/lib/removeDuplicates";

const buildUrl = (query: string) => {
  const baseUrl = "https://itunes.apple.com/search";
  const urlParams = new URLSearchParams({
    term: query,
    entity: "song,album",
  });

  return `${baseUrl}?${urlParams}`;
};

const ItunesApiSchema = z.object({
  resultCount: z.number(),
  results: z.array(
    z.discriminatedUnion("wrapperType", [SongSchema, AlbumSchema])
  ),
});

export default function useSearch(query?: string | null) {
  const { data, ...rest } = useSWRImmutable(
    query ? buildUrl(query) : null,
    (url) => fetcher(url, ItunesApiSchema)
  );

  if (!data) {
    return {
      data: [],
      ...rest,
    };
  }

  return {
    data: removeDuplicates(
      data.results
        .map((val) => getMediaFromSongOrAlbum(val))
        .filter(
          (val) => !val.title.toLowerCase().match(/(edit|remix|parody)/g)
        ),
      ["title", "artist"]
    ),
    ...rest,
  };
}
