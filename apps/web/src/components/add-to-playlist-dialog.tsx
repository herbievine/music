import { useState } from "react";
import { ListPlus, Check, Plus } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	useUserPlaylists,
	useAddTrackToPlaylist,
	useCreatePlaylist,
} from "@/api/user-playlists";
import { cn } from "@/lib/utils";

type Track = {
	id: string;
	name: string;
	artists: string[];
	albumName: string;
	albumImage: string;
	durationMs: number;
};

type Props = {
	track: Track;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function AddToPlaylistDialog({ track, open, onOpenChange }: Props) {
	const { data } = useUserPlaylists();
	const addTrack = useAddTrackToPlaylist();
	const createPlaylist = useCreatePlaylist();
	const [newName, setNewName] = useState("");
	const [showCreate, setShowCreate] = useState(false);
	const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

	const playlists = data?.playlists ?? [];

	function handleAdd(playlistId: string) {
		addTrack.mutate(
			{
				playlistId,
				trackId: track.id,
				trackMetadata: {
					name: track.name,
					artists: track.artists,
					albumName: track.albumName,
					albumImage: track.albumImage,
					durationMs: track.durationMs,
				},
			},
			{
				onSuccess: () => {
					setAddedIds((prev) => new Set([...prev, playlistId]));
				},
			},
		);
	}

	function handleCreate() {
		if (!newName.trim()) return;
		createPlaylist.mutate(
			{ name: newName.trim() },
			{
				onSuccess: (playlist) => {
					setNewName("");
					setShowCreate(false);
					handleAdd(playlist.id);
				},
			},
		);
	}

	return (
		<Dialog open={open} onOpenChange={(o) => { onOpenChange(o); setAddedIds(new Set()); setShowCreate(false); }}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ListPlus className="w-4 h-4 text-primary" />
						Add to playlist
					</DialogTitle>
				</DialogHeader>

				<div className="text-xs text-muted-foreground mb-3 truncate">
					{track.name} · {track.artists[0]}
				</div>

				<div className="flex flex-col gap-1 max-h-64 overflow-y-auto -mx-1 px-1">
					{playlists.length === 0 && !showCreate && (
						<p className="text-sm text-muted-foreground py-4 text-center">No playlists yet</p>
					)}
					{playlists.map((pl) => (
						<button
							key={pl.id}
							type="button"
							onClick={() => handleAdd(pl.id)}
							className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left w-full group"
						>
							<div className="min-w-0">
								<p className="text-sm font-medium truncate">{pl.name}</p>
							</div>
							<Check
								className={cn(
									"w-4 h-4 flex-shrink-0 transition-opacity",
									addedIds.has(pl.id) ? "text-primary opacity-100" : "opacity-0",
								)}
							/>
						</button>
					))}
				</div>

				<div className="mt-3 pt-3 border-t border-border/50">
					{showCreate ? (
						<div className="flex gap-2">
							<Input
								autoFocus
								placeholder="Playlist name"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleCreate()}
								className="flex-1 h-8 text-sm"
							/>
							<Button
								size="sm"
								onClick={handleCreate}
								disabled={!newName.trim() || createPlaylist.isPending}
								className="bg-primary hover:bg-primary/90 text-primary-foreground"
							>
								Create
							</Button>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setShowCreate(true)}
							className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full px-1"
						>
							<Plus className="w-4 h-4" />
							New playlist
						</button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
