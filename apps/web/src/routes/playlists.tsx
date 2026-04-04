import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListMusic, Plus } from "lucide-react";
import { useUserPlaylists, useCreatePlaylist } from "@/api/user-playlists";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/playlists")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: myPlaylistsData, isLoading: myPlaylistsLoading } = useUserPlaylists();
	const myPlaylists = myPlaylistsData?.playlists ?? [];

	return (
		<div className="flex flex-col gap-8 px-8 py-6">
			{/* Mobile header */}
			<div className="lg:hidden h-16 flex items-center">
				<header className="w-full h-16 fixed top-0 left-1/2 -translate-x-1/2 z-10 backdrop-blur-md bg-background/70">
					<div className="w-full h-16 px-4 max-w-lg mx-auto flex items-center">
						<h1 className="text-2xl font-bold">Playlists</h1>
					</div>
				</header>
			</div>

			{/* Desktop header */}
			<h1 className="hidden lg:block text-2xl font-bold">Playlists</h1>

			{myPlaylistsLoading ? (
				<PlaylistsSkeleton />
			) : (
				<PlaylistsSection playlists={myPlaylists} />
			)}
		</div>
	);
}

function PlaylistsSection({ playlists }: { playlists: { id: string; name: string; description: string | null }[] }) {
	const createPlaylist = useCreatePlaylist();
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState("");

	function handleCreate() {
		if (!name.trim()) return;
		createPlaylist.mutate(
			{ name: name.trim() },
			{
				onSuccess: () => {
					setName("");
					setShowForm(false);
				},
			},
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Header with inline button */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{playlists.length > 0 && (
						<span className="text-xs text-muted-foreground">{playlists.length}</span>
					)}
				</div>
				<button
					type="button"
					onClick={() => setShowForm((v) => !v)}
					className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					<Plus className="w-3.5 h-3.5" />
					New playlist
				</button>
			</div>

			{/* Create form */}
			{showForm && (
				<div className="flex gap-2">
					<Input
						autoFocus
						placeholder="Playlist name…"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleCreate();
							if (e.key === "Escape") {
								setShowForm(false);
								setName("");
							}
						}}
						className="flex-1 h-8 text-sm"
					/>
					<Button
						size="sm"
						onClick={handleCreate}
						disabled={!name.trim() || createPlaylist.isPending}
						className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3 text-sm"
					>
						Create
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							setShowForm(false);
							setName("");
						}}
						className="h-8 px-3 text-sm"
					>
						Cancel
					</Button>
				</div>
			)}

			{/* Playlists grid */}
			{playlists.length === 0 && !showForm ? (
				<p className="text-sm text-muted-foreground/60 py-1">Create a playlist to organize your music.</p>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
					{playlists.map((pl) => (
						<Link
							key={pl.id}
							to="/my-playlist/$id"
							params={{ id: pl.id }}
							className="flex flex-col gap-2 group"
						>
							<div className="relative aspect-square overflow-hidden rounded-xl bg-card border border-white/5 flex items-center justify-center group-hover:border-white/10 transition-colors">
								<ListMusic className="w-10 h-10 text-white/20 group-hover:text-white/30 transition-colors" strokeWidth={1} />
							</div>
							<div>
								<p className="text-sm font-medium truncate">{pl.name}</p>
								<p className="text-xs text-muted-foreground">Playlist</p>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

function PlaylistsSkeleton() {
	return (
		<div className="flex flex-col gap-8">
			<div className="h-5 w-32 bg-secondary rounded animate-pulse" />
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="flex flex-col gap-2">
						<div className="aspect-square bg-secondary rounded-xl animate-pulse" />
						<div className="h-3.5 w-3/4 bg-secondary/70 rounded animate-pulse" />
						<div className="h-3 w-1/2 bg-secondary/50 rounded animate-pulse" />
					</div>
				))}
			</div>
		</div>
	);
}
