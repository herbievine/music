"use client";

import Image from "next/image";
import DisplaySongs from "@/components/display-songs";
import PlayButton from "@/components/play-button";
import Metadata from "@/components/metadata";
import { useSearchHistoryStore } from "@/store/search-history";
import { useEffect } from "react";
import { MediaAlbum } from "@/types/media";
import dayjs from "dayjs";

type AlbumViewerProps = {
  album: MediaAlbum;
};

export default function AlbumViewer({ album }: AlbumViewerProps) {
  const { add } = useSearchHistoryStore();

  useEffect(() => {
    add(album);
  }, [add, album]);

  return (
    <div className="w-full flex flex-col space-y-4 items-center">
      <Image
        src={album.coverLinkHigh}
        alt={`${album.title} by ${album.artist}`}
        width={200}
        height={200}
        className="rounded-lg"
      />
      <div className="flex flex-col space-y-1 items-center">
        <h2 className="text-xl font-bold">{album.title}</h2>
        <h3 className="text-sm font-bold">{album.artist}</h3>
        <p className="text-xs text-neutral-500 uppercase font-black tracking-wider">
          {album.genre} - {dayjs(album.releaseDate).format("YYYY")}
        </p>
      </div>
      <PlayButton songs={album.songs} />
      <DisplaySongs songs={album.songs} />
      <Metadata songs={album.songs} />
    </div>
  );
}
