import { Album } from "@/schemas/album";
import { Song } from "@/schemas/song";

export type Media = {
  id: number;
  title: string;
  artist: string;
  coverLink: string;
  genre: string;
  releaseDate: string;
} & (
  | {
      type: "song";
      album: Omit<MediaAlbum, "raw">;
      duration: number;
      trackNumber: number;
      audioLink?: string;
      raw: Song;
    }
  | {
      type: "album";
      songs: MediaSong[];
      raw: Album;
    }
);

export type MediaSong = Extract<Media, { type: "song" }>;
export type MediaAlbum = Extract<Media, { type: "album" }>;
