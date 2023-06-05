"use client";

import Image from "next/image";
import DisplaySongs from "@/components/display-songs";
import PlayButton from "@/components/play-button";
import Link from "next/link";
import Metadata from "@/components/metadata";
import { useHistoryStore } from "@/store/history";
import { useEffect } from "react";
import { MediaSong } from "@/types/media";
import dayjs from "dayjs";

type SongViewerProps = {
  song: MediaSong;
};

export default function SongViewer({ song }: SongViewerProps) {
  const { add } = useHistoryStore();

  useEffect(() => {
    add(song);
  }, [add, song]);

  return (
    <div className="w-full flex flex-col space-y-4 items-center">
      <Image
        src={song.coverLinkHigh}
        alt={`${song.title} by ${song.artist}`}
        width={200}
        height={200}
        className="rounded-lg"
      />
      <div className="flex flex-col space-y-1 items-center">
        <h2 className="text-xl font-bold">{song.title}</h2>
        <h3 className="text-sm font-bold">
          <Link className="underline" href={`/album?id=${song.album.id}`}>
            {song.album.title}
          </Link>
          {" • "}
          {song.artist}
        </h3>
        <p className="text-xs text-neutral-500 uppercase font-black tracking-wider">
          {song.genre} - {dayjs(song.releaseDate).format("YYYY")}
        </p>
      </div>
      <PlayButton songs={[song]} />
      <DisplaySongs songs={[song]} />
      <Metadata songs={[song]} />
    </div>
  );
}
