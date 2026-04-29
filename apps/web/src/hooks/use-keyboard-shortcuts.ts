import { type RefObject, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueueStore } from "../store/queue";

const VOLUME_STEP = 0.05;

export function useKeyboardShortcuts({
	audioRef,
}: {
	audioRef: RefObject<HTMLAudioElement>;
}) {
	const { play, pause, next, previous, toggleShuffle, toggleQueuePanel, setQueueTab } = useQueueStore();
	const isPlaying = useQueueStore((s) => s.isPlaying);
	const hasSongs = useQueueStore((s) => s.songs.length > 0);
	const queueTab = useQueueStore((s) => s.queueTab);
	const navigate = useNavigate();
	// Use refs so the keydown handler always sees the latest values
	// without needing to be re-attached on every state change.
	const isPlayingRef = useRef(isPlaying);
	const hasSongsRef = useRef(hasSongs);
	const queueTabRef = useRef(queueTab);
	isPlayingRef.current = isPlaying;
	hasSongsRef.current = hasSongs;
	queueTabRef.current = queueTab;

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// Don't capture when typing in inputs or textareas
			const tag = (e.target as HTMLElement)?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
				return;
			}

			// Cmd/Ctrl+K — open search
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				navigate({ to: "/search" });
				return;
			}

			// Don't capture when modifier keys are held (except shift for volume)
			if (e.ctrlKey || e.metaKey || e.altKey) return;

			if (!hasSongsRef.current) return;

			switch (e.key) {
				case " ":
				case "p":
				case "P": {
					e.preventDefault();
					if (isPlayingRef.current) {
						pause();
					} else {
						play();
					}
					break;
				}
				case "ArrowRight":
				case "n":
				case "N": {
					e.preventDefault();
					next();
					break;
				}
				case "ArrowLeft":
				case "b":
				case "B": {
					e.preventDefault();
					previous();
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					if (audioRef.current) {
						audioRef.current.volume = Math.min(1, audioRef.current.volume + VOLUME_STEP);
					}
					break;
				}
				case "ArrowDown": {
					e.preventDefault();
					if (audioRef.current) {
						audioRef.current.volume = Math.max(0, audioRef.current.volume - VOLUME_STEP);
					}
					break;
				}
				case "m":
				case "M": {
					if (audioRef.current) {
						audioRef.current.muted = !audioRef.current.muted;
					}
					break;
				}
				case "s":
				case "S": {
					toggleShuffle();
					break;
				}
				case "l":
				case "L": {
					setQueueTab(queueTabRef.current === "lyrics" ? "queue" : "lyrics");
					break;
				}
				case "q":
				case "Q": {
					toggleQueuePanel();
					break;
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [audioRef, play, pause, next, previous, toggleShuffle, toggleQueuePanel, setQueueTab, navigate]);
}
