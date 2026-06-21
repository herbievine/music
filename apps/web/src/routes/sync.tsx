import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Disc, ListMusic, Music, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
	useImportLibrary,
	useSyncStatus,
	type SyncAlbum,
	type SyncPlaylist,
	type SyncTrack,
} from "@/api/sync";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sync")({
	component: RouteComponent,
});

type Selection = {
	tracks: Set<string>;
	albums: Set<string>;
	playlists: Set<string>;
};

const emptySelection = (): Selection => ({
	tracks: new Set(),
	albums: new Set(),
	playlists: new Set(),
});

function SyncRow({
	icon,
	title,
	subtitle,
	image,
	imported,
	checked,
	onToggle,
}: {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	image: string;
	imported: boolean;
	checked: boolean;
	onToggle: () => void;
}) {
	return (
		<label
			className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
				imported
					? "opacity-50 cursor-default"
					: "cursor-pointer hover:bg-secondary"
			}`}
		>
			<input
				type="checkbox"
				className="h-4 w-4 accent-primary shrink-0"
				disabled={imported}
				checked={imported || checked}
				onChange={onToggle}
			/>
			<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-card border border-white/5 flex items-center justify-center">
				{image ? (
					<img src={image} alt={title} className="h-full w-full object-cover" />
				) : (
					icon
				)}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium">{title}</p>
				<p className="truncate text-xs text-muted-foreground">{subtitle}</p>
			</div>
			{imported && (
				<span className="shrink-0 text-xs text-muted-foreground/70">Imported</span>
			)}
		</label>
	);
}

function Section<T extends { id: string; imported: boolean }>({
	title,
	items,
	selected,
	onToggleAll,
	renderRow,
}: {
	title: string;
	items: T[];
	selected: Set<string>;
	onToggleAll: (ids: string[]) => void;
	renderRow: (item: T) => React.ReactNode;
}) {
	const selectable = items.filter((i) => !i.imported).map((i) => i.id);
	const allSelected =
		selectable.length > 0 && selectable.every((id) => selected.has(id));

	return (
		<section className="flex flex-col gap-1">
			<div className="flex items-center justify-between px-3">
				<h2 className="text-sm font-semibold">
					{title}{" "}
					<span className="text-muted-foreground/60">({items.length})</span>
				</h2>
				{selectable.length > 0 && (
					<button
						type="button"
						onClick={() => onToggleAll(selectable)}
						className="text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						{allSelected ? "Deselect all" : "Select all"}
					</button>
				)}
			</div>
			{items.length === 0 ? (
				<p className="px-3 py-2 text-sm text-muted-foreground/60">Nothing here.</p>
			) : (
				<div className="flex flex-col">{items.map(renderRow)}</div>
			)}
		</section>
	);
}

function RouteComponent() {
	const { data, isLoading, isError, refetch } = useSyncStatus();
	const importLibrary = useImportLibrary();
	const [selection, setSelection] = useState<Selection>(emptySelection);

	function toggle(kind: keyof Selection, id: string) {
		setSelection((prev) => {
			const next = new Set(prev[kind]);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return { ...prev, [kind]: next };
		});
	}

	function toggleAll(kind: keyof Selection, ids: string[]) {
		setSelection((prev) => {
			const allSelected = ids.every((id) => prev[kind].has(id));
			const next = new Set(prev[kind]);
			if (allSelected) ids.forEach((id) => next.delete(id));
			else ids.forEach((id) => next.add(id));
			return { ...prev, [kind]: next };
		});
	}

	const totalSelected =
		selection.tracks.size + selection.albums.size + selection.playlists.size;

	function handleSync() {
		if (!data || totalSelected === 0) return;
		const byId = <T extends { id: string }>(items: T[], ids: Set<string>) =>
			items.filter((i) => ids.has(i.id));

		importLibrary.mutate(
			{
				tracks: byId(data.tracks, selection.tracks).map(
					({ imported, ...t }) => t,
				),
				albums: byId(data.albums, selection.albums).map(
					({ imported, ...a }) => a,
				),
				playlistIds: [...selection.playlists],
			},
			{
				onSuccess: (r) => {
					const summary = `Imported ${r.tracksImported} songs, ${r.albumsImported} albums, ${r.playlistsImported} playlists`;
					if (r.errors.length > 0) {
						toast.error(`${summary}. ${r.errors.length} item(s) failed.`);
					} else {
						toast.success(summary);
					}
					setSelection(emptySelection());
				},
				onError: () => toast.error("Import failed"),
			},
		);
	}

	return (
		<div className="flex flex-col gap-6 px-4 sm:px-8 py-2 sm:py-6 pb-28">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Sync</h1>
					<p className="text-sm text-muted-foreground">
						Import your saved Spotify library into your account.
					</p>
				</div>
			</div>

			{isError ? (
				<div className="flex flex-col items-center gap-3 py-16 text-center">
					<p className="text-sm text-muted-foreground">
						Couldn't load your Spotify library.
					</p>
					<Button variant="secondary" onClick={() => refetch()}>
						Try again
					</Button>
				</div>
			) : isLoading || !data ? (
				<SyncSkeleton />
			) : (
				<div className="flex flex-col gap-8">
					<Section<SyncTrack>
						title="Liked Songs"
						items={data.tracks}
						selected={selection.tracks}
						onToggleAll={(ids) => toggleAll("tracks", ids)}
						renderRow={(t) => (
							<SyncRow
								key={t.id}
								icon={<Music className="h-4 w-4 text-white/30" />}
								title={t.name}
								subtitle={t.artists.join(", ")}
								image={t.albumImage}
								imported={t.imported}
								checked={selection.tracks.has(t.id)}
								onToggle={() => toggle("tracks", t.id)}
							/>
						)}
					/>

					<Section<SyncAlbum>
						title="Saved Albums"
						items={data.albums}
						selected={selection.albums}
						onToggleAll={(ids) => toggleAll("albums", ids)}
						renderRow={(a) => (
							<SyncRow
								key={a.id}
								icon={<Disc className="h-4 w-4 text-white/30" />}
								title={a.name}
								subtitle={a.artist}
								image={a.image}
								imported={a.imported}
								checked={selection.albums.has(a.id)}
								onToggle={() => toggle("albums", a.id)}
							/>
						)}
					/>

					<Section<SyncPlaylist>
						title="Playlists"
						items={data.playlists}
						selected={selection.playlists}
						onToggleAll={(ids) => toggleAll("playlists", ids)}
						renderRow={(p) => (
							<SyncRow
								key={p.id}
								icon={<ListMusic className="h-4 w-4 text-white/30" />}
								title={p.name}
								subtitle={p.description || "Playlist"}
								image={p.image}
								imported={p.imported}
								checked={selection.playlists.has(p.id)}
								onToggle={() => toggle("playlists", p.id)}
							/>
						)}
					/>
				</div>
			)}

			<div className="sticky bottom-0 z-10 -mx-4 sm:-mx-8 border-t border-white/5 bg-card/90 backdrop-blur-md px-4 sm:px-8 py-3">
				<div className="flex items-center justify-between gap-4">
					<span className="text-sm text-muted-foreground">
						{totalSelected} selected
					</span>
					<Button
						onClick={handleSync}
						disabled={totalSelected === 0 || importLibrary.isPending}
						className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
					>
						<RefreshCw
							className={`h-4 w-4 ${importLibrary.isPending ? "animate-spin" : ""}`}
						/>
						{importLibrary.isPending ? "Syncing…" : "Sync selected"}
					</Button>
				</div>
			</div>
		</div>
	);
}

function SyncSkeleton() {
	return (
		<div className="flex flex-col gap-3">
			{Array.from({ length: 8 }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 px-3 py-2">
					<div className="h-4 w-4 rounded bg-secondary animate-pulse" />
					<div className="h-10 w-10 rounded bg-secondary animate-pulse" />
					<div className="flex flex-col gap-1.5">
						<div className="h-3.5 w-40 bg-secondary/70 rounded animate-pulse" />
						<div className="h-3 w-24 bg-secondary/50 rounded animate-pulse" />
					</div>
				</div>
			))}
		</div>
	);
}
