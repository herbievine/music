import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListMusic, Plus } from "lucide-react";
import { useUserPlaylists, useCreatePlaylist } from "@/api/user-playlists";
import type { SpotifyPlaylist } from "@/api/user-playlists";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/playlists")({
	component: RouteComponent,
});

function CreatePlaylistForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
	const createPlaylist = useCreatePlaylist();
	const [name, setName] = useState("");

	function handleCreate() {
		if (!name.trim()) return;
		createPlaylist.mutate(
			{ name: name.trim() },
			{
				onSuccess: () => {
					setName("");
					onSuccess();
				},
			},
		);
	}

	return (
		<div className="flex gap-2">
			<Input
				autoFocus
				placeholder="Playlist name…"
				value={name}
				onChange={(e) => setName(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") handleCreate();
					if (e.key === "Escape") {
						onCancel();
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
					onCancel();
					setName("");
				}}
				className="h-8 px-3 text-sm"
			>
				Cancel
			</Button>
		</div>
	);
}

function CreatePlaylistButton() {
	const [showForm, setShowForm] = useState(false);

	return showForm ? (
		<CreatePlaylistForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
	) : (
		<button
			type="button"
			onClick={() => setShowForm(true)}
			className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
		>
			<Plus className="w-3.5 h-3.5" />
			New playlist
		</button>
	);
}

function PlaylistsSection({ playlists }: { playlists: SpotifyPlaylist[] }) {
	return (
		<div className="flex flex-col gap-6">
			{/* Playlists grid */}
			{playlists.length === 0 ? (
				<p className="text-sm text-muted-foreground/60 py-1">Create a playlist to organize your music.</p>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
					{playlists.map((pl) => {
						const imageUrl = pl.images?.[0]?.url;
						return (
							<Link
								key={pl.id}
								to="/playlist/$id"
								params={{ id: pl.id }}
								className="flex flex-col gap-2 group"
							>
								<div className="relative aspect-square overflow-hidden rounded-xl bg-card border border-white/5 flex items-center justify-center group-hover:border-white/10 transition-colors">
									{imageUrl ? (
										<img
											src={imageUrl}
											alt={pl.name}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
										/>
									) : (
										<ListMusic className="w-10 h-10 text-white/20 group-hover:text-white/30 transition-colors" strokeWidth={1} />
									)}
								</div>
								<div>
									<p className="text-sm font-medium truncate">{pl.name}</p>
									<p className="text-xs text-muted-foreground">Playlist</p>
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}

function RouteComponent() {
	const { data: myPlaylistsData, isLoading: myPlaylistsLoading } = useUserPlaylists();
	const myPlaylists = myPlaylistsData?.playlists ?? [];

	return (
		<div className="flex flex-col gap-8 px-4 sm:px-8 py-6">
			{/* Mobile header */}
			<div className="lg:hidden h-16 flex items-center">
				<header className="w-full h-16 fixed top-0 left-1/2 -translate-x-1/2 z-10 backdrop-blur-md bg-background/70">
					<div className="w-full h-16 px-4 max-w-lg mx-auto flex items-center justify-between">
						<h1 className="text-2xl font-bold">Playlists</h1>
						<CreatePlaylistButton />
					</div>
				</header>
			</div>

			{/* Desktop header */}
			<div className="hidden lg:flex items-center justify-between">
				<h1 className="text-2xl font-bold">Playlists</h1>
				<CreatePlaylistButton />
			</div>

			{myPlaylistsLoading ? (
				<PlaylistsSkeleton />
			) : (
				<PlaylistsSection playlists={myPlaylists} />
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
