"use client";

import useSearch from "@/hooks/useSearch";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import debounce from "lodash/debounce";
import Image from "next/image";

export default function Search() {
  const [query, setQuery] = useState("");
  const { register, setValue } = useForm({
    defaultValues: {
      query,
    },
  });
  const { data, isLoading: isSearching } = useSearch(query);

  return (
    <div className="w-full flex flex-col space-y-4">
      <h1 className="text-3xl font-black">Music</h1>
      <input
        {...register("query")}
        onChange={debounce((e) => {
          setValue("query", e.target.value);
          setQuery(e.target.value);
        }, 300)}
        placeholder="Search..."
        className="px-3 py-1.5 rounded-lg bg-neutral-800 w-full text-white"
      />
      {isSearching && <p>Searching...</p>}
      <div className="flex flex-col divide-y divide-neutral-800">
        {data?.map((songOrAlbum) => (
          <Link
            key={
              songOrAlbum.wrapperType === "track"
                ? songOrAlbum.trackId
                : songOrAlbum.collectionId
            }
            className="py-2 cursor-pointer"
            href={`/view?id=${
              songOrAlbum.wrapperType === "track"
                ? songOrAlbum.trackId
                : songOrAlbum.collectionId
            }`}
          >
            <div className={"w-full flex items-center space-x-2"}>
              <Image
                src={songOrAlbum.artworkUrl100}
                alt={`${
                  songOrAlbum.wrapperType === "track"
                    ? songOrAlbum.trackName
                    : songOrAlbum.collectionName
                } by ${songOrAlbum.artistName}`}
                width={45}
                height={45}
                className="rounded-lg"
              />
              <div className="flex flex-col">
                <p className="font-semibold">
                  {songOrAlbum.wrapperType === "track"
                    ? songOrAlbum.trackName
                    : songOrAlbum.collectionName}
                </p>
                <p className="text-sm font-semibold text-neutral-500 truncate">
                  {songOrAlbum.wrapperType === "track" ? "Song" : "Album"}
                  {" • "}
                  {songOrAlbum.artistName}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
