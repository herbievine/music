import { useEffect, useRef, useState } from "react";
import { useQueueStore } from "../../store/queue";
import cn from "../../utils/cn";
import { trpc } from "../../utils/trpc";
import { AudioTag } from "./audio";
import { PlayerExpandedView } from "./player-expanded-view";
import { PlayerMiniView } from "./player-mini-view";
import { useClickAway } from "@uidotdev/usehooks";
import { useMediaSession } from "../../hooks/use-media-session";

export function Player() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const ref = useClickAway(() => setIsExpanded(false));
  const { songs, songIndex, isPlaying } = useQueueStore();
  const { data } = trpc.play.useQuery(
    { songId: songIndex !== -1 ? songs[songIndex].itunesId.toString() : "" },
    { enabled: songIndex !== -1 },
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);

  useMediaSession({ audioRef });

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
    <div
      className={cn(
        "w-full max-w-lg mx-auto fixed bottom-0",
        !isExpanded && "p-4",
      )}
    >
      <div
        className={cn(
          "w-full bg-zinc-800",
          "transition-all duration-300 ease-in-out",
          isExpanded
            ? "p-6 h-[calc(100vh_*_0.8)] rounded-t-2xl"
            : "p-2 h-14 rounded-xl",
        )}
        onClick={() => {
          setIsExpanded((p) => !p);
        }}
      >
        {isExpanded ? (
          <PlayerExpandedView
            // @ts-ignore
            playerRef={ref}
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
