import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { ReactNode, RefObject } from "react";
import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";
import { useMediaSession } from "../hooks/use-media-session";
import { client } from "../lib/hono-rpc";
import { useQueueStore } from "../store/queue";
import { AudioTag } from "../components/player/audio";

type AudioContextValue = {
	audioRef: RefObject<HTMLAudioElement>;
	progressRef: RefObject<HTMLInputElement>;
	progress: number;
	setProgress: (progress: number) => void;
	data: { url: string } | undefined;
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudioContext() {
	const ctx = useContext(AudioContext);
	if (!ctx) throw new Error("useAudioContext must be used within AudioProvider");
	return ctx;
}

export function AudioProvider({ children }: { children: ReactNode }) {
	const { session } = useClerk();
	const [progress, setProgress] = useState(0);
	const audioRef = useRef<HTMLAudioElement>(null);
	const progressRef = useRef<HTMLInputElement>(null);
	const { songs, songIndex, isPlaying } = useQueueStore();

	const { data } = useQuery({
		queryKey: ["play", songs[songIndex]],
		queryFn: async () => {
			const res = await client.play[":spotifyId"].$get(
				{
					param: { spotifyId: songs[songIndex].id },
					query: {
						duration: Math.round(songs[songIndex].durationMs / 1000).toString(),
						...(songs[songIndex + 1] ? { next: songs[songIndex + 1].id } : {}),
					},
				},
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error(`cannot play ${songs[songIndex]}`);
			}

			return res.json();
		},
		enabled: songIndex !== -1,
	});

	useMediaSession({ audioRef });
	useKeyboardShortcuts({ audioRef });

	// Keep screen on while playing
	useEffect(() => {
		let wakeLock: WakeLockSentinel | null = null;

		const acquireWakeLock = async () => {
			if (!isPlaying || songIndex === -1) return;
			if (!("wakeLock" in navigator)) return;

			try {
				wakeLock = await navigator.wakeLock.request("screen");
			} catch (err) {
				console.log("Wake Lock request failed:", err);
			}
		};

		const releaseWakeLock = () => {
			if (wakeLock) {
				wakeLock.release();
				wakeLock = null;
			}
		};

		if (isPlaying && songIndex !== -1) {
			acquireWakeLock();
		} else {
			releaseWakeLock();
		}

		// Release lock if visibility changes
		const handleVisibilityChange = () => {
			if (document.hidden) {
				releaseWakeLock();
			} else if (isPlaying && songIndex !== -1) {
				acquireWakeLock();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			releaseWakeLock();
		};
	}, [isPlaying, songIndex]);

	// Sync audio element with store state.
	// Always require `data` before playing — without it, the audio element still
	// has the previous song's src buffered and would briefly replay the old track.
	useEffect(() => {
		if (songIndex === -1 || !isPlaying || !data) {
			audioRef.current?.pause();
		} else {
			audioRef.current?.play();
		}
	}, [songIndex, isPlaying, data]);

	return (
		<AudioContext.Provider value={{ audioRef, progressRef, progress, setProgress, data }}>
			{children}
			<AudioTag
				src={data?.url}
				audioRef={audioRef}
				progressRef={progressRef}
				setProgress={setProgress}
			/>
		</AudioContext.Provider>
	);
}
