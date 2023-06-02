"use client";

import useSearch from "@/hooks/useSearch";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function Search() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"song" | "album">("song");
  const { register, setValue } = useForm({
    defaultValues: {
      query,
    },
  });
  const { data } = useSearch(query);

  console.log(data);

  return (
    <div className="w-full flex flex-col space-y-4">
      <input
        {...register("query")}
        onChange={(e) => {
          setValue("query", e.target.value);
          setQuery(e.target.value);
        }}
        placeholder="Search..."
        className="px-4 py-2 rounded-lg border border-neutral-900 w-full text-black"
      />
      <div className="w-full flex justify-between items-center space-x-4">
        <button
          onClick={() => setTab("song")}
          className={`px-4 py-2 rounded-lg border border-neutral-900 ${
            tab === "song" ? "bg-neutral-900 text-white" : ""
          }`}
        >
          Songs
        </button>
        <button
          onClick={() => setTab("album")}
          className={`px-4 py-2 rounded-lg border border-neutral-900 ${
            tab === "album" ? "bg-neutral-900 text-white" : ""
          }`}
        >
          Albums
        </button>
      </div>
      {data && (
        <div className="flex flex-col divide-y divide-neutral-500 rounded-lg">
          {tab === "song"
            ? data.songs?.map((song) => (
                <Link
                  key={song.trackId}
                  className="py-2 cursor-pointer"
                  href={`/song?trackId=${song.trackId}`}
                >
                  {song.trackName} by {song.artistName} :song: (
                  {song.collectionName})
                </Link>
              ))
            : data.albums?.map((album) => (
                <div key={album.collectionId} className="py-2 cursor-pointer">
                  {album.collectionName} - {album.artistName} :album:
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
