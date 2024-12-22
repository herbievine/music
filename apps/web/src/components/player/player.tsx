import { useEffect, useRef, useState } from "react";
import { useQueueStore } from "../../store/queue";
import cn from "../../utils/cn";
import { trpc } from "../../utils/trpc";
import { AudioTag } from "./audio";
import { PlayerExpandedView } from "./player-expanded-view";
import { PlayerMiniView } from "./player-mini-view";

export function Player() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [progress, setProgress] = useState(0);
  const { songs, songIndex, isPlaying } = useQueueStore();
  const { data } = trpc.play.useQuery(
    { songId: songIndex !== -1 ? songs[songIndex].itunesId.toString() : "" },
    { enabled: songIndex !== -1 },
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);

  // Used to sync store with audio ref
  useEffect(() => {
    if (songIndex !== -1 && isPlaying) {
      audioRef.current?.play();
    }

    if (songIndex === -1 || !isPlaying) {
      audioRef.current?.pause();
    }
  }, [songIndex, isPlaying]);

  // Used to trigger play after song link is loaded
  useEffect(() => {
    if (isPlaying && data) {
      audioRef.current?.play();
    }
  }, [data, isPlaying]);

  if (songs.length === 0) {
    return;
  }

  return (
    <div className="w-full max-w-lg p-4 mx-auto fixed bottom-0 bg-red-500/50">
      <div
        className={cn(
          "w-full bg-zinc-800 rounded-xl",
          "transition-all duration-200 ease-in-out",
          isExpanded ? "p-6 h-[calc(100vh_*_0.8)]" : "p-2 h-14",
        )}
        onClick={() => {
          setIsExpanded((p) => !p);
        }}
      >
        {isExpanded ? (
          <PlayerExpandedView
            audioRef={audioRef}
            progressRef={progressRef}
            progress={progress}
          />
        ) : (
          <PlayerMiniView />
        )}
      </div>
      <AudioTag
        src={data}
        audioRef={audioRef}
        progressRef={progressRef}
        setProgress={setProgress}
      />
    </div>
  );
}