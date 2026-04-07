import { useClickAway } from "@uidotdev/usehooks";
import { useState } from "react";
import { useAudioContext } from "../../contexts/audio-context";
import { useQueueStore } from "../../store/queue";
import cn from "../../utils/cn";
import { PlayerExpandedView } from "./player-expanded-view";
import { PlayerMiniView } from "./player-mini-view";

export function Player() {
	const [isExpanded, setIsExpanded] = useState(false);
	const ref = useClickAway(() => setIsExpanded(false));
	const { songs } = useQueueStore();
	const { audioRef, progressRef, progress } = useAudioContext();

	if (songs.length === 0) {
		return;
	}

	return (
		<div
			className={cn(
				"w-full max-w-lg mx-auto fixed bottom-16 z-50",
				!isExpanded && "p-2",
			)}
		>
			<div
				className={cn(
					"w-full z-10 backdrop-blur-md",
					"transition-all duration-300 ease-in-out",
					isExpanded
						? "p-6 h-[calc(100vh_*_0.8)] rounded-t-2xl bg-neutral-900/90"
						: "p-2 h-14 rounded-xl bg-neutral-500/30",
				)}
				onClick={() => {
					setIsExpanded((p) => !p);
				}}
			>
				{isExpanded ? (
					<PlayerExpandedView
						// @ts-expect-error
						playerRef={ref}
						audioRef={audioRef}
						progressRef={progressRef}
						progress={progress}
					/>
				) : (
					<PlayerMiniView />
				)}
			</div>
		</div>
	);
}
