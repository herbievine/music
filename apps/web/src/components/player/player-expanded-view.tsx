import { ListX, Pause, Play, SkipBackIcon, SkipForward } from "lucide-react";
import { useQueueStore } from "../../store/queue";
import type { RefObject } from "react";
import { formatTime } from "../../lib/format-time";
import { Link } from "@tanstack/react-router";

type Props = {
  playerRef: RefObject<HTMLDivElement>;
  audioRef: RefObject<HTMLAudioElement>;
  progressRef: RefObject<HTMLInputElement>;
  progress: number;
};

export function PlayerExpandedView({
  playerRef,
  audioRef,
  progressRef,
  progress,
}: Props) {
  const { songs, songIndex, play, pause, next, previous, isPlaying } =
    useQueueStore();

  if (songIndex === -1) {
    return null;
  }

  return (
    <div
      ref={playerRef}
      className="w-full h-full flex flex-col items-center space-y-4"
    >
      <div className="w-full flex space-x-4 items-center">
        <img src={songs[songIndex].artworkUrl100} className="h-20 rounded-lg" />
        <div className="w-full flex flex-col items-start">
          <span className="font-semibold">{songs[songIndex].name}</span>
          <Link
            to="/albums/$id"
            params={{ id: songs[songIndex].itunesAlbumId }}
            className="underline text-sm text-neutral-500"
          >
            {songs[songIndex].album.name}
          </Link>
          <span className="text-sm text-neutral-500">
            {songs[songIndex].artist.name}
          </span>
        </div>
      </div>
      <p className="w-full text-sm text-left">Next up</p>
      <div className="w-full h-full flex flex-col space-y-4 overflow-y-auto">
        {songs.length - 1 >= songIndex + 1 ? (
          songs.slice(songIndex + 1).map((song) => (
            <div key={song.id} className="w-full flex space-x-2 items-center">
              <img src={song.artworkUrl100} className="h-12 rounded-lg" />
              <div className="w-full flex flex-col items-start">
                <span className="line-clamp-1">{song.name}</span>
                <span className="text-sm line-clamp-1 text-neutral-500">
                  {song.album.name} - {song.artist.name}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <ListX strokeWidth={1.5} size={128} className="stroke-zinc-500" />
          </div>
        )}
      </div>
      <div className="w-full flex flex-col items-center space-y-8 py-8">
        <div className="w-full flex flex-col items-center space-y-1">
          <input
            className="w-full h-2 bg-zinc-700 accent-zinc-100 rounded-lg appearance-none"
            type="range"
            ref={progressRef}
            defaultValue="0"
            onChange={() => {
              if (!audioRef.current || !progressRef.current) return;
              audioRef.current.currentTime = +progressRef.current.value;
            }}
          />
          <div className="w-full flex items-center justify-between">
            <span className="text-neutral-500 font-bold text-xs">
              {formatTime(progress * 1000)}
            </span>
            <span className="text-neutral-500 font-bold text-xs">
              -{formatTime(songs[songIndex].trackTimeMillis - progress * 1000)}
            </span>
          </div>
        </div>
        <div className="w-full flex justify-evenly items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              previous();
            }}
          >
            <SkipBackIcon strokeWidth={2} size={32} />
          </button>
          {isPlaying ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                pause();
              }}
            >
              <Pause strokeWidth={2} size={40} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                play();
              }}
            >
              <Play strokeWidth={2} size={40} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              next();
            }}
          >
            <SkipForward strokeWidth={2} size={32} />
          </button>
        </div>
      </div>
    </div>
  );
}
