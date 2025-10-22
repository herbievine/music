import { type RefObject, useEffect, useRef, useState } from "react";
import { useQueueStore } from "../../store/queue";

type Props = {
	src: string | undefined;
	audioRef: RefObject<HTMLAudioElement>;
	progressRef: RefObject<HTMLInputElement>;
	setProgress: (progress: number) => void;
};

export function AudioTag({ src, audioRef, progressRef, setProgress }: Props) {
	const { next, play, pause } = useQueueStore();
	const firstPlayTried = useRef(false);
	const [needsGesture, setNeedsGesture] = useState(false);

	async function tryPlay() {
		if (!audioRef.current) {
			alert("audio ref null");
			return;
		}

		try {
			await audioRef.current.play();
			play();
			setNeedsGesture(false);
		} catch (err) {
			console.error("Audio error code:", err);
			alert(`Error playing song\ncode: ${JSON.stringify(err)}`);

			// iOS PWA will throw NotAllowedError until a user gesture
			// if (
			// 	err?.name === "NotAllowedError" ||
			// 	err?.message?.includes("gesture")
			// ) {
			// 	setNeedsGesture(true);
			// 	alert("Needs gesture");
			// } else {
			// 	const code = err?.code || "unknown";
			// 	console.error("Audio error code:", code, target.error);
			// 	alert(`Error playing song\ncode: ${code}\nerr: ${err.message}`);
			// 	console.error("Audio play error:", err);
			// 	alert("Error playing song");
			// }
		}
	}

	useEffect(() => {
		if (!audioRef.current || !src) return;
		const el = audioRef.current;
		// Assigning src via prop is fine; .load() nudges iOS to re-evaluate metadata
		el.load();
		firstPlayTried.current = false; // allow onCanPlay to try once
	}, [src, audioRef]);

	return (
		<>
			{/* biome-ignore lint/a11y/useMediaCaption: shut up */}
			<audio
				src={src}
				ref={audioRef}
				playsInline
				preload="metadata"
				controls={false}
				onEnded={() => {
					pause();
					next();
				}}
				onCanPlay={() => {
					if (!firstPlayTried.current) {
						firstPlayTried.current = true;
						void tryPlay();
					}
				}}
				onTimeUpdate={() => {
					if (!audioRef.current || !progressRef.current) return;

					const currentTime = audioRef.current.currentTime;
					const seconds = audioRef.current.duration;

					setProgress(currentTime);
					progressRef.current.value = currentTime.toString();
					progressRef.current.max = seconds.toString();
				}}
				onError={(e) => {
					const target = e.currentTarget;
					const code = target.error?.code || "unknown";
					console.error("Audio error code:", code, target.error);
					alert(`Error playing song\ncode: ${code}\nerr: ${target.error}`);
				}}
			/>
			{needsGesture && (
				<button
					type="button"
					onClick={tryPlay}
					style={{
						position: "absolute",
						inset: 0,
						display: "grid",
						placeItems: "center",
						backdropFilter: "blur(2px)",
						background: "rgba(0,0,0,0.35)",
						color: "white",
						fontWeight: 600,
						border: "none",
						cursor: "pointer",
					}}
				>
					Tap to play
				</button>
			)}
		</>
	);
}
