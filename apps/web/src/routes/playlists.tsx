import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ListMusic, Plus } from "lucide-react";
import { useUserPlaylists, useCreatePlaylist } from "@/api/user-playlists";
import type { SpotifyPlaylist } from "@/api/user-playlists";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/playlists")({
	component: RouteComponent,
});

const PAGE_SIZE = 15;

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

function PlaylistsGrid({ playlists }: { playlists: SpotifyPlaylist[] }) {
	return (
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
	);
}

function Pagination({
	offset,
	total,
	pageSize,
	hasPrev,
	hasNext,
	onPrev,
	onNext,
}: {
	offset: number;
	total: number;
	pageSize: number;
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
}) {
	const from = offset + 1;
	const to = Math.min(offset + pageSize, total);

	return (
		<div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onPrev}
					disabled={!hasPrev}
					className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
				>
					<ChevronLeft className="w-4 h-4" />
				</button>
				<span className="px-2">{from}–{to} of {total}</span>
				<button
					type="button"
					onClick={onNext}
					disabled={!hasNext}
					className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
				>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

function RouteComponent() {
	const [offset, setOffset] = useState(0);
	const { data, isLoading } = useUserPlaylists(offset);

	const playlists = data?.playlists ?? [];
	const total = data?.total ?? 0;
	const hasPrev = offset > 0;
	const hasNext = offset + PAGE_SIZE < total;

	return (
		<div className="flex flex-col gap-8 px-4 sm:px-8 py-2 sm:py-6">
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

			{isLoading ? (
				<PlaylistsSkeleton />
			) : playlists.length === 0 && offset === 0 ? (
				<p className="text-sm text-muted-foreground/60 py-1">Create a playlist to organize your music.</p>
			) : (
				<>
					<PlaylistsGrid playlists={playlists} />
					{total > PAGE_SIZE && (
						<Pagination
							offset={offset}
							total={total}
							pageSize={PAGE_SIZE}
							hasPrev={hasPrev}
							hasNext={hasNext}
							onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
							onNext={() => setOffset((o) => o + PAGE_SIZE)}
						/>
					)}
				</>
			)}
		</div>
	);
}

function PlaylistsSkeleton() {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
			{Array.from({ length: PAGE_SIZE }).map((_, i) => (
				<div key={i} className="flex flex-col gap-2">
					<div className="aspect-square bg-secondary rounded-xl animate-pulse" />
					<div className="h-3.5 w-3/4 bg-secondary/70 rounded animate-pulse" />
					<div className="h-3 w-1/2 bg-secondary/50 rounded animate-pulse" />
				</div>
			))}
		</div>
	);
}
