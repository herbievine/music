import { z } from "zod";
import { fetcher } from "../utils/fetcher";
import { itunesApiSchema } from "../schemas/itunes";

export function itunes(query: string) {
  const searchParams = new URLSearchParams();

  searchParams.append("term", query);
  searchParams.append("entity", "song,album");

  return fetcher(
    `https://itunes.apple.com/search?${searchParams}`,
    itunesApiSchema,
  );
}

export function itunesFindAlbums(query: string) {
  const searchParams = new URLSearchParams();

  searchParams.append("id", query);
  searchParams.append("entity", "album");

  return fetcher(
    `https://itunes.apple.com/lookup?${searchParams}`,
    itunesApiSchema,
  );
}

export function itunesFindSongs(query: string) {
  const searchParams = new URLSearchParams();

  searchParams.append("id", query);
  searchParams.append("entity", "song");

  return fetcher(
    `https://itunes.apple.com/lookup?${searchParams}`,
    itunesApiSchema,
  );
}

export async function findSong(id: string) {
  const url = new URL("/lookup", "https://itunes.apple.com/");

  url.searchParams.append("id", id);
  url.searchParams.append("entity", "song");

  const { results } = await fetcher(url.toString(), itunesApiSchema);

  const entity = results.find((res) => res.wrapperType === "track");

  return entity || null;
}

export async function findAlbum(id: string) {
  const url = new URL("/lookup", "https://itunes.apple.com/");

  url.searchParams.append("id", id);
  url.searchParams.append("entity", "album");

  const { results } = await fetcher(url.toString(), itunesApiSchema);

  const entity = results.find((res) => res.wrapperType === "collection");

  return entity || null;
}

export async function findArtist(id: string) {
  const url = new URL("/lookup", "https://itunes.apple.com/");

  url.searchParams.append("id", id);

  const { results } = await fetcher(url.toString(), itunesApiSchema);

  const entity = results.find((res) => res.wrapperType === "artist");

  return entity || null;
}
