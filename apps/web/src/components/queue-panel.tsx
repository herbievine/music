import { Link } from "@tanstack/react-router";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Heart, HeartOff, ListX, Music2, X } from "lucide-react";
import { useMemo } from "react";
import { useAudioContext } from "../contexts/audio-context";
import { useAlbumColor } from "../hooks/use-album-color";
import { useIsLiked, useLikeMutation } from "../hooks/use-likes";
import { useLyrics } from "../api/lyrics";
import { LyricsView } from "./lyrics-view";
import { useQueueStore } from "../store/queue";
import type { SimpleTrack } from "../store/queue";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function QueuePanel() {
	const { songs, songIndex, skipTo, reorder, remove, queueTab: tab, setQueueTab: setTab } = useQueueStore();
	const { progress } = useAudioContext();

	const currentSong = songs[songIndex];
	const { data: lyricsData, isLoading: lyricsLoading } = useLyrics(
		currentSong?.id ?? "",
		currentSong?.name ?? "",
		currentSong?.artists?.[0]?.name ?? "",
		currentSong?.durationMs ?? 0,
	);
	const albumColor = useAlbumColor(currentSong?.album.image);
	const gradientStyle = useMemo(() => {
		if (!albumColor) return undefined;
		const [r, g, b] = albumColor;
		return {
			background: `linear-gradient(to bottom, rgba(${r},${g},${b},0.3) 0%, var(--card) 100%)`,
		} as React.CSSProperties;
	}, [albumColor]);

	if (songIndex === -1 || !songs[songIndex]) {
		return (
			<div className="w-72 flex-shrink-0 rounded-xl bg-card flex flex-col items-center justify-center gap-3">
				<Music2 className="w-10 h-10 text-muted-foreground/30" strokeWidth={1.5} />
				<span className="text-sm text-muted-foreground/60">Nothing playing</span>
			</div>
		);
	}

	const upcoming = songs.slice(songIndex + 1);

	return (
		<div className="w-72 flex-shrink-0 rounded-xl bg-card flex flex-col overflow-hidden transition-colors duration-700">
			{/* Album art — square */}
			<div className="w-full aspect-square flex-shrink-0 overflow-hidden rounded-t-xl relative">
				<img
					src={currentSong.album.image}
					alt={currentSong.album.name}
					className="w-full h-full object-cover"
				/>
				{/* Color gradient overlay at bottom of art */}
				{albumColor && (
					<div
						className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
						style={{
							background: `linear-gradient(to top, rgba(${albumColor[0]},${albumColor[1]},${albumColor[2]},0.6), transparent)`,
						}}
					/>
				)}
			</div>

			{/* Track info + like */}
			<div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2 transition-all duration-700" style={gradientStyle}>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-sm truncate leading-tight">
						{currentSong.name}
					</p>
					{currentSong.artists[0] && (
						<Link
							to="/artist/$id"
							params={{ id: currentSong.artists[0].id }}
							className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate block mt-0.5"
						>
							{currentSong.artists[0].name}
						</Link>
					)}
					<Link
						to="/album/$id"
						params={{ id: currentSong.album.id }}
						className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors truncate block mt-0.5"
					>
						{currentSong.album.name}
					</Link>
				</div>
				<LikeButton songId={currentSong.id} song={currentSong} />
			</div>

			{/* Tab selector */}
			<div className="border-t border-border/50" />
			<div className="flex gap-2 px-4 pt-2 border-b border-border/50">
				<button
					onClick={() => setTab("lyrics")}
					className={`flex-1 py-2 text-xs font-medium transition-colors ${
						tab === "lyrics"
							? "text-foreground border-b-2 border-foreground -mb-[2px]"
							: "text-muted-foreground/50"
					}`}
				>
					Lyrics
				</button>
				<button
					onClick={() => setTab("queue")}
					className={`flex-1 py-2 text-xs font-medium transition-colors ${
						tab === "queue"
							? "text-foreground border-b-2 border-foreground -mb-[2px]"
							: "text-muted-foreground/50"
					}`}
				>
					Queue
				</button>
			</div>

			{tab === "lyrics" ? (
				<div className="flex-1 min-h-0">
				<ScrollArea className="h-full">
					<div className="px-4 py-3">
						<LyricsView
							plain={lyricsData?.plain ?? null}
							synced={lyricsData?.synced ?? null}
							progress={progress}
							isLoading={lyricsLoading}
						/>
					</div>
				</ScrollArea>
			</div>
		) : (
				<QueueList upcoming={upcoming} songIndex={songIndex} skipTo={skipTo} reorder={reorder} remove={remove} />
			)}
		</div>
	);
}

function QueueList({
	upcoming,
	songIndex,
	skipTo,
	reorder,
	remove,
}: {
	upcoming: SimpleTrack[];
	songIndex: number;
	skipTo: (songId: string) => void;
	reorder: (fromIndex: number, toIndex: number) => void;
	remove: (songId: string) => void;
}) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		// Convert from upcoming-relative indices to absolute queue indices
		const fromUpcoming = upcoming.findIndex((t) => t.id === active.id);
		const toUpcoming = upcoming.findIndex((t) => t.id === over.id);
		if (fromUpcoming === -1 || toUpcoming === -1) return;

		const fromAbsolute = songIndex + 1 + fromUpcoming;
		const toAbsolute = songIndex + 1 + toUpcoming;
		reorder(fromAbsolute, toAbsolute);
	}

	return (
		<>
			<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-4 pt-3 pb-1">
				Next up
			</p>

			<ScrollArea className="flex-1 pb-3">
				{upcoming.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-6 gap-2">
						<ListX className="w-7 h-7 text-muted-foreground/30" strokeWidth={1.5} />
						<span className="text-xs text-muted-foreground/50">Queue empty</span>
					</div>
				) : (
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
						<SortableContext items={upcoming.map((t) => t.id)} strategy={verticalListSortingStrategy}>
							<div className="px-2 pb-2">
								{upcoming.map((track) => (
									<SortableTrackItem key={track.id} track={track} skipTo={skipTo} remove={remove} />
								))}
							</div>
						</SortableContext>
					</DndContext>
				)}
			</ScrollArea>
		</>
	);
}

function SortableTrackItem({
	track,
	skipTo,
	remove,
}: {
	track: SimpleTrack;
	skipTo: (songId: string) => void;
	remove: (songId: string) => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"w-full flex items-center gap-1 px-1 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left group",
				isDragging && "opacity-50 bg-secondary/50",
			)}
		>
			<button
				type="button"
				className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors touch-none"
				{...attributes}
				{...listeners}
			>
				<GripVertical className="w-3.5 h-3.5" />
			</button>
			<button
				type="button"
				onClick={() => skipTo(track.id)}
				className="flex items-center gap-3 min-w-0 flex-1"
			>
				<img
					src={track.album.image}
					alt={track.album.name}
					className="w-9 h-9 rounded-md object-cover flex-shrink-0"
				/>
				<div className="min-w-0">
					<p className="text-xs font-medium truncate group-hover:text-foreground transition-colors">
						{track.name}
					</p>
					<p className="text-xs text-muted-foreground truncate">
						{track.artists[0]?.name}
					</p>
				</div>
			</button>
			<button
				type="button"
				onClick={() => remove(track.id)}
				className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/30 hover:text-muted-foreground"
			>
				<X className="w-3.5 h-3.5" />
			</button>
		</div>
	);
}

function LikeButton({
	songId,
	song,
}: {
	songId: string;
	song: { name: string; album: { image: string }; artists: { name: string }[] };
}) {
	const { isLiked, likeEntry } = useIsLiked(songId, "track");
	const { like, unlike } = useLikeMutation();

	return (
		<button
			type="button"
			onClick={() => {
				if (isLiked && likeEntry) {
					unlike.mutate(likeEntry.id);
				} else {
					like.mutate({
						itemId: songId,
						itemType: "track",
						metadata: {
							name: song.name,
							image: song.album.image,
							artist: song.artists[0]?.name ?? "",
						},
					});
				}
			}}
			className={cn(
				"flex-shrink-0 p-1 transition-colors mt-0.5",
				isLiked ? "text-emerald-400 hover:text-emerald-300" : "text-muted-foreground/50 hover:text-foreground",
			)}
		>
			{isLiked ? <HeartOff className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
		</button>
	);
}
