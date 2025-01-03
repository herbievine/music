import { useQueueStore } from "../../store/queue";
import type { RefObject } from "react";

type Props = {
  src: string | undefined;
  audioRef: RefObject<HTMLAudioElement>;
  progressRef: RefObject<HTMLInputElement>;
  setProgress: (progress: number) => void;
};

export function AudioTag({ src, audioRef, progressRef, setProgress }: Props) {
  const { next } = useQueueStore();

  return (
    <audio
      src={src}
      ref={audioRef}
      onEnded={next}
      onTimeUpdate={() => {
        if (!audioRef.current || !progressRef.current) return;

        const currentTime = audioRef.current.currentTime;
        const seconds = audioRef.current.duration;

        setProgress(currentTime);
        progressRef.current.value = currentTime.toString();
        progressRef.current.max = seconds.toString();
      }}
      onLoadedMetadata={() => {
        audioRef.current?.play();
      }}
    />
  );
}
