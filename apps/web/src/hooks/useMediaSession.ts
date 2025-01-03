import { useEffect, type RefObject } from "react";
import { useQueueStore } from "../store/queue";

type Props = {
  audioRef: RefObject<HTMLAudioElement>;
};

export function useMediaSession({ audioRef }: Props) {
  const { play, pause, next, previous } = useQueueStore();
  const song = useQueueStore((s) => s.songs[s.songIndex]);

  useEffect(() => {
    if (song && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name,
        artist: song.artist.name,
        album: song.album.name,
        artwork: [
          {
            src: `https://albums.herbievine.com/${song.album.bucketCoverId}`,
            sizes: "96x96",
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

  useEffect(() => {
    if (song && "mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", play);
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
      }
    };
  }, [song?.id]);

  useEffect(() => {
    if (song && "mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("pause", pause);
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("pause", null);
      }
    };
  }, [song?.id]);

  useEffect(() => {
    if (song && "mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("nexttrack", next);
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("nexttrack", null);
      }
    };
  }, [song?.id]);

  useEffect(() => {
    if (song && "mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("previoustrack", previous);
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("previoustrack", null);
      }
    };
  }, [song?.id]);
}
