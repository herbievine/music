"use client";

import { useSearchHistoryStore } from "@/store/search-history";
import { useEffect } from "react";
import MediaViewer from "./media-viewer";

export default function SearchHistory() {
  const { history } = useSearchHistoryStore();

  useEffect(() => {
    useSearchHistoryStore.persist.rehydrate();
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="font-bold border-b border-neutral-800 pb-2">History</p>
      <div className="flex flex-col divide-y divide-neutral-800">
        {history.map((media) => (
          <MediaViewer key={media.id} media={media} />
        ))}
      </div>
    </div>
  );
}
