import { Pause, Play, SkipForward } from "lucide-react";
import { useQueueStore } from "../../store/queue";

export function PlayerMiniView() {
  const { songs, songIndex, play, pause, next, isPlaying } = useQueueStore();

  if (songIndex === -1) {
    return null;
  }

  return (
    <div className="w-full h-full flex justify-between items-center">
      <div className="flex space-x-2 items-center">
        <img src={songs[songIndex].artworkUrl100} className="h-10 rounded-lg" />
        <div className="w-full flex flex-col items-start">
          <p className="font-semibold line-clamp-1">{songs[songIndex].name}</p>
          <p className="text-sm font-semibold text-neutral-500 line-clamp-1">
            {songs[songIndex].artist.name}
          </p>
        </div>
      </div>
      <div className="flex space-x-2 items-center">
        {isPlaying ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              pause();
            }}
          >
            <Pause strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              play();
            }}
          >
            <Play strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            next();
          }}
        >
          <SkipForward strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
