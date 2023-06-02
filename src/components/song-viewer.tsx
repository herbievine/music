"use client";

import { Song } from "@/schemas/song";
import Image from "next/image";
import DisplaySongs from "@/components/display-songs";
import PlayButton from "@/components/play-button";
import DownloadSongButton from "@/components/download-song-button";
import Link from "next/link";
import Metadata from "@/components/metadata";

type SongViewerProps = {
  song: Song;
};

export default function SongViewer({ song }: SongViewerProps) {
  return (
    <div className="w-full flex flex-col space-y-4 items-center">
      <Image
        src={song.artworkUrl100}
        alt={`${song.trackName} by ${song.artistName}`}
        width={200}
        height={200}
        className="rounded-lg"
      />
      <div className="flex flex-col space-y-1 items-center">
        <h2 className="text-xl font-bold">{song.trackName}</h2>
        <h3 className="text-sm font-bold">
          <Link className="underline" href={`/view?id=${song.collectionId}`}>
            {song.collectionName}
          </Link>
          {" • "}
          {song.artistName}
        </h3>
        <p className="text-xs text-neutral-500 uppercase font-black tracking-wider">
          {song.primaryGenreName} - {new Date(song.releaseDate).getFullYear()}
        </p>
      </div>
      {/* <div className="w-full flex justify-center space-x-4">
        <PlayButton song={song} />
        <DownloadSongButton song={song} />
      </div> */}
      <DisplaySongs songs={[song]} />
      <Metadata songs={[song]} />
    </div>
  );
}
