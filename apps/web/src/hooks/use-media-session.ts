import { useEffect, useMemo, type RefObject } from "react";
import { useQueueStore } from "../store/queue";

type Props = {
  audioRef: RefObject<HTMLAudioElement>;
};

export function useMediaSession({ audioRef }: Props) {
  const { play, pause, next, previous } = useQueueStore();
  const song = useQueueStore((s) => s.songs[s.songIndex]);

  const actionHandlers = useMemo(
    () =>
      [
        {
          key: "play",
          fn: () => {
            play();
            navigator.mediaSession.playbackState = "playing";
          },
        },
        {
          key: "pause",
          fn: () => {
            pause();
            navigator.mediaSession.playbackState = "paused";
          },
        },
        {
          key: "nexttrack",
          fn: next,
        },
        {
          key: "previoustrack",
          fn: previous,
        },
      ] as const,
    [play, pause, next, previous, navigator.mediaSession],
  );

  useEffect(() => {
    if (song && "mediaSession" in navigator && audioRef.current) {
      audioRef.current.addEventListener("playing", () => {
        for (const { key, fn } of actionHandlers) {
          navigator.mediaSession.setActionHandler(key, fn);
        }
      });
    }

    return () => {
      if ("mediaSession" in navigator && audioRef.current) {
        audioRef.current.addEventListener("playing", () => null);

        for (const { key } of actionHandlers) {
          navigator.mediaSession.setActionHandler(key, null);
        }
      }
    };
  }, [song?.id]);

  useEffect(() => {
    if (song && "mediaSession" in navigator) {
      // always clear seek forward/backward
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name,
        artist: song.artist.name,
        album: song.album.name,
        artwork: [
          {
            src: `https://albums.herbievine.com/${song.album.bucketCoverId}`,
            type: "image/png",
          },
        ],
      });
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
      }
    };
  }, [song?.id]);
}
