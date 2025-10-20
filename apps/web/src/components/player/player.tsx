import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useClickAway } from "@uidotdev/usehooks";
import { useEffect, useRef, useState } from "react";
import { useMediaSession } from "../../hooks/use-media-session";
import { client } from "../../lib/hono-rpc";
import { useQueueStore } from "../../store/queue";
import cn from "../../utils/cn";
import { AudioTag } from "./audio";
import { PlayerExpandedView } from "./player-expanded-view";
import { PlayerMiniView } from "./player-mini-view";

export function Player() {
	const { session } = useClerk();
	const [isExpanded, setIsExpanded] = useState(false);
	const [progress, setProgress] = useState(0);
	const ref = useClickAway(() => setIsExpanded(false));
	const { songs, songIndex, isPlaying } = useQueueStore();
	const { data } = useQuery({
		queryKey: ["play", songs[songIndex]],
		queryFn: async () => {
			const res = await client.play[":spotifyId"].$get(
				{
					param: {
						spotifyId: songs[songIndex].id,
					},
					...(songs[songIndex + 1]
						? {
								query: {
									next: songs[songIndex + 1].id,
								},
							}
						: {}),
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
	const audioRef = useRef<HTMLAudioElement>(null);
	const progressRef = useRef<HTMLInputElement>(null);

	useMediaSession({ audioRef });

	// Used to sync store with audio ref
	useEffect(() => {
		if (songIndex !== -1 && isPlaying) {
			audioRef.current?.play();
		}

		if (songIndex === -1 || !isPlaying) {
			audioRef.current?.pause();
		}
	}, [songIndex, isPlaying]);

	// Used to trigger play after song link is loaded
	useEffect(() => {
		if (isPlaying && data) {
			audioRef.current?.play();
		}
	}, [data, isPlaying]);

	if (songs.length === 0) {
		return;
	}

	return (
		<div
			className={cn(
				"w-full max-w-lg mx-auto fixed bottom-16",
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
			<AudioTag
				src={data?.url}
				audioRef={audioRef}
				progressRef={progressRef}
				setProgress={setProgress}
			/>
		</div>
	);
}
