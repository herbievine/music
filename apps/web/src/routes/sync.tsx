import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Disc, ListMusic, Music, RefreshCw } from "lucide-react";
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

type TabKey = keyof Selection;

const emptySelection = (): Selection => ({
	tracks: new Set(),
	albums: new Set(),
	playlists: new Set(),
});

// Spotify returns playlist descriptions HTML-escaped (e.g. "soul &amp; funk").
// Decode them once via a detached textarea so they read naturally.
const decoder =
	typeof document !== "undefined" ? document.createElement("textarea") : null;
function decodeEntities(s: string): string {
	if (!decoder || !s.includes("&")) return s;
	decoder.innerHTML = s;
	return decoder.value;
}

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
			className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
				imported
					? "cursor-default border-transparent opacity-40"
					: checked
						? "cursor-pointer border-primary/40 bg-primary/10"
						: "cursor-pointer border-transparent hover:bg-secondary"
			}`}
		>
			<input
				type="checkbox"
				className="sr-only"
				disabled={imported}
				checked={imported || checked}
				onChange={onToggle}
			/>
			<span
				className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
					imported || checked
						? "border-primary bg-primary text-primary-foreground"
						: "border-white/25 group-hover:border-white/50"
				}`}
			>
				{(imported || checked) && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
			</span>
			<div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-card border border-white/5 flex items-center justify-center">
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
				<span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
					Imported
				</span>
			)}
		</label>
	);
}

function Section<T extends { id: string; imported: boolean }>({
	items,
	selected,
	onToggleAll,
	renderRow,
	emptyLabel,
}: {
	items: T[];
	selected: Set<string>;
	onToggleAll: (ids: string[]) => void;
	renderRow: (item: T) => React.ReactNode;
	emptyLabel: string;
}) {
	const selectable = items.filter((i) => !i.imported).map((i) => i.id);
	const allSelected =
		selectable.length > 0 && selectable.every((id) => selected.has(id));
	const importedCount = items.length - selectable.length;

	if (items.length === 0) {
		return (
			<p className="px-3 py-10 text-center text-sm text-muted-foreground/60">
				{emptyLabel}
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between px-3 pb-1">
				<span className="text-xs text-muted-foreground/70">
					{selectable.length > 0
						? `${selectable.length} available to import`
						: "All imported"}
					{importedCount > 0 && selectable.length > 0
						? ` · ${importedCount} already imported`
						: ""}
				</span>
				{selectable.length > 0 && (
					<button
						type="button"
						onClick={() => onToggleAll(selectable)}
						className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						{allSelected ? "Deselect all" : "Select all"}
					</button>
				)}
			</div>
			<div className="flex flex-col">{items.map(renderRow)}</div>
		</div>
	);
}

function RouteComponent() {
	const { data, isLoading, isError, refetch } = useSyncStatus();
	const importLibrary = useImportLibrary();
	const [selection, setSelection] = useState<Selection>(emptySelection);
	const [tab, setTab] = useState<TabKey>("tracks");

	function toggle(kind: TabKey, id: string) {
		setSelection((prev) => {
			const next = new Set(prev[kind]);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return { ...prev, [kind]: next };
		});
	}

	function toggleAll(kind: TabKey, ids: string[]) {
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

	const tabs: { key: TabKey; label: string; count: number; selected: number }[] =
		data
			? [
					{
						key: "tracks",
						label: "Liked Songs",
						count: data.tracks.length,
						selected: selection.tracks.size,
					},
					{
						key: "albums",
						label: "Albums",
						count: data.albums.length,
						selected: selection.albums.size,
					},
					{
						key: "playlists",
						label: "Playlists",
						count: data.playlists.length,
						selected: selection.playlists.size,
					},
				]
			: [];

	return (
		<div className="flex flex-col px-4 sm:px-8 py-2 sm:py-6 pb-28">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
				<div>
					<h1 className="text-2xl font-bold">Sync</h1>
					<p className="text-sm text-muted-foreground">
						Import your saved Spotify library into your account.
					</p>
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
					<>
						<div className="flex gap-1 rounded-xl bg-card p-1">
							{tabs.map((t) => (
								<button
									key={t.key}
									type="button"
									onClick={() => setTab(t.key)}
									className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
										tab === t.key
											? "bg-secondary text-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<span>{t.label}</span>
									<span className="text-xs text-muted-foreground/60">
										{t.count}
									</span>
									{t.selected > 0 && (
										<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
											{t.selected}
										</span>
									)}
								</button>
							))}
						</div>

						{tab === "tracks" && (
							<Section<SyncTrack>
								items={data.tracks}
								selected={selection.tracks}
								onToggleAll={(ids) => toggleAll("tracks", ids)}
								emptyLabel="No liked songs in your Spotify library."
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
						)}

						{tab === "albums" && (
							<Section<SyncAlbum>
								items={data.albums}
								selected={selection.albums}
								onToggleAll={(ids) => toggleAll("albums", ids)}
								emptyLabel="No saved albums in your Spotify library."
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
						)}

						{tab === "playlists" && (
							<Section<SyncPlaylist>
								items={data.playlists}
								selected={selection.playlists}
								onToggleAll={(ids) => toggleAll("playlists", ids)}
								emptyLabel="No playlists in your Spotify library."
								renderRow={(p) => (
									<SyncRow
										key={p.id}
										icon={<ListMusic className="h-4 w-4 text-white/30" />}
										title={decodeEntities(p.name)}
										subtitle={decodeEntities(p.description) || "Playlist"}
										image={p.image}
										imported={p.imported}
										checked={selection.playlists.has(p.id)}
										onToggle={() => toggle("playlists", p.id)}
									/>
								)}
							/>
						)}
					</>
				)}
			</div>

			<div className="sticky bottom-0 z-10 -mx-4 border-t border-white/5 bg-card/90 px-4 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
				<div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
					<span className="text-sm text-muted-foreground">
						{totalSelected === 0
							? "Nothing selected"
							: `${totalSelected} selected`}
					</span>
					<Button
						onClick={handleSync}
						disabled={totalSelected === 0 || importLibrary.isPending}
						className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
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
				<div key={i} className="flex items-center gap-3 px-3 py-2.5">
					<div className="h-5 w-5 rounded-md bg-secondary animate-pulse" />
					<div className="h-11 w-11 rounded-md bg-secondary animate-pulse" />
					<div className="flex flex-col gap-1.5">
						<div className="h-3.5 w-40 bg-secondary/70 rounded animate-pulse" />
						<div className="h-3 w-24 bg-secondary/50 rounded animate-pulse" />
					</div>
				</div>
			))}
		</div>
	);
}
