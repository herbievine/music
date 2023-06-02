"use client";

import { Song } from "@/schemas/song";
import Image from "next/image";
import DisplaySongs from "@/components/display-songs";
import PlayButton from "@/components/play-button";
import DownloadSongButton from "@/components/download-song-button";
import { Album } from "@/schemas/album";
import Metadata from "@/components/metadata";
import { useSearchHistoryStore } from "@/store/search-history";
import { useEffect } from "react";

type AlbumViewerProps = {
  album: Album;
  songs: Song[];
};

export default function AlbumViewer({ album, songs }: AlbumViewerProps) {
  const { add } = useSearchHistoryStore();

  useEffect(() => {
    add({
      id: album.collectionId,
      type: "album",
      title: album.collectionName,
      artist: album.artistName,
      coverLink: album.artworkUrl100,
    });
  }, [add, album]);

  return (
    <div className="w-full flex flex-col space-y-4 items-center">
      <Image
        src={album.artworkUrl100}
        alt={`${album.collectionName} by ${album.artistName}`}
        width={200}
        height={200}
        className="rounded-lg"
      />
      <div className="flex flex-col space-y-1 items-center">
        <h2 className="text-xl font-bold">{album.collectionName}</h2>
        <h3 className="text-sm font-bold">{album.artistName}</h3>
        <p className="text-xs text-neutral-500 uppercase font-black tracking-wider">
          {album.primaryGenreName} - {new Date(album.releaseDate).getFullYear()}
        </p>
      </div>
      <div className="w-full flex justify-center space-x-4">
        <PlayButton songs={songs} />
        {/* <DownloadSongButton song={songs[0]} /> */}
      </div>
      <DisplaySongs songs={songs} />
      <Metadata songs={songs} />
    </div>
  );
}
