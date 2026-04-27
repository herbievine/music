import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "shuffle-on-play";

function readPreference(): boolean {
	if (typeof window === "undefined") return false;
	return window.localStorage.getItem(STORAGE_KEY) === "true";
}

export function useShufflePreference() {
	const [shuffleOnPlay, setShuffleOnPlay] = useState<boolean>(readPreference);

	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY) setShuffleOnPlay(e.newValue === "true");
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	const toggle = useCallback(() => {
		setShuffleOnPlay((prev) => {
			const next = !prev;
			window.localStorage.setItem(STORAGE_KEY, String(next));
			return next;
		});
	}, []);

	return { shuffleOnPlay, toggle };
}

export function shuffleTracks<T>(tracks: T[]): T[] {
	const arr = [...tracks];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}
