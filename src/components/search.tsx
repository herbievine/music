"use client";

import useSearch from "@/hooks/useSearch";
import { useState } from "react";
import { useForm } from "react-hook-form";
import debounce from "lodash/debounce";
import SearchHistory from "./search-history";
import MediaViewer from "./media-viewer";

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
      <input
        {...register("query")}
        onChange={debounce((e) => {
          setValue("query", e.target.value);
          setQuery(e.target.value);
        }, 300)}
        placeholder="Search..."
        className="px-3 py-1.5 font-semibold rounded-lg bg-neutral-800 w-full text-white"
      />
      {isSearching && <p>Searching...</p>}
      <div className="flex flex-col divide-y divide-neutral-800">
        {data?.map((media) => (
          <MediaViewer key={media.id} media={media} />
        ))}
      </div>
      <SearchHistory />
    </div>
  );
}
