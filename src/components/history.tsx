"use client";

import { useHistoryStore } from "@/store/history";
import { useEffect } from "react";
import MediaViewer from "@/components/media-viewer";

export default function History() {
  const { history } = useHistoryStore();

  useEffect(() => {
    useHistoryStore.persist.rehydrate();
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="font-bold border-b border-neutral-800 pb-2">History</p>
      <div className="flex flex-col divide-y divide-neutral-800">
        {history.map((media) => (
          <MediaViewer key={media.id} media={media} link />
        ))}
      </div>
    </div>
  );
}
