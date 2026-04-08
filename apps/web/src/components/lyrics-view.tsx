import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LyricsLine {
	time: number;
	text: string;
}

function parseLrc(lrc: string): LyricsLine[] {
	const lines: LyricsLine[] = [];
	const regex = /\[(\d{2}):(\d{2})\.(\d{2})\]\s*(.*)/g;
	let match;

	while ((match = regex.exec(lrc)) !== null) {
		const minutes = parseInt(match[1], 10);
		const seconds = parseInt(match[2], 10);
		const centiseconds = parseInt(match[3], 10);
		const time = minutes * 60 + seconds + centiseconds / 100;
		const text = match[4].trim();

		if (text) {
			lines.push({ time, text });
		}
	}

	return lines;
}

interface LyricsViewProps {
	plain: string | null;
	synced: string | null;
	progress: number;
	isLoading: boolean;
}

export function LyricsView({
	plain,
	synced,
	progress,
	isLoading,
}: LyricsViewProps) {
	const currentLineRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const lyricsLines = synced ? parseLrc(synced) : null;

	useEffect(() => {
		if (currentLineRef.current && containerRef.current) {
			currentLineRef.current.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	}, [progress]);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-2 h-full">
				{[...Array(8)].map((_, i) => (
					<div key={i} className="h-4 bg-neutral-700 rounded animate-pulse" />
				))}
			</div>
		);
	}

	if (!plain && !synced) {
		return (
			<div className="flex items-center justify-center h-full text-neutral-500 text-sm">
				No lyrics available
			</div>
		);
	}

	if (lyricsLines && lyricsLines.length > 0) {
		const currentLineIndex = lyricsLines.findIndex(
			(line, idx) =>
				line.time <= progress &&
				(idx === lyricsLines.length - 1 ||
					lyricsLines[idx + 1].time > progress),
		);

		return (
			<div
				ref={containerRef}
				className="flex flex-col gap-3 overflow-y-auto h-full pt-6 pb-6"
				style={{ scrollbarWidth: "none" }}
			>
				{lyricsLines.map((line, idx) => (
					<div
						key={idx}
						ref={idx === currentLineIndex ? currentLineRef : undefined}
						className={cn(
							"text-sm transition-colors duration-200",
							idx === currentLineIndex
								? "text-white font-semibold"
								: "text-neutral-500",
						)}
					>
						{line.text}
					</div>
				))}
			</div>
		);
	}

	// Plain lyrics fallback
	return (
		<div
			className="flex flex-col gap-2 overflow-y-auto h-full whitespace-pre-wrap text-sm text-neutral-400 pt-6 pb-6"
			style={{ scrollbarWidth: "none" }}
		>
			{plain}
		</div>
	);
}
