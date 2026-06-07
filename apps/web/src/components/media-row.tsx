import type {
	MusicAlbumSummary,
	MusicArtist,
	MusicPlaylistSummary,
	MusicTrack,
} from "@music/api";
import { Link } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";
import type { ReactNode } from "react";

export type HomeItem =
	| MusicTrack
	| MusicAlbumSummary
	| MusicArtist
	| MusicPlaylistSummary;

// Display fields per item type — what to show on a card regardless of layout.
function fields(item: HomeItem): {
	image?: string;
	primary: string;
	secondary?: string;
	// id used for the shared view-transition with the destination route.
	transitionId: string;
} {
	switch (item.type) {
		case "track":
			return {
				image: item.album.images[0]?.url,
				primary: item.name,
				secondary: item.artists[0]?.name,
				transitionId: item.album.id,
			};
		case "album":
			return {
				image: item.images[0]?.url,
				primary: item.name,
				secondary: item.artists[0]?.name,
				transitionId: item.id,
			};
		case "artist":
			return {
				image: item.images[0]?.url,
				primary: item.name,
				transitionId: item.id,
			};
		case "playlist":
			return {
				image: item.images[0]?.url,
				primary: item.name,
				transitionId: item.id,
			};
	}
}

// Links an item to its detail route. Tracks link to their album.
function ItemLink({
	item,
	className,
	children,
}: {
	item: HomeItem;
	className: string;
	children: ReactNode;
}) {
	switch (item.type) {
		case "track":
			return (
				<Link to="/album/$id" params={{ id: item.album.id }} className={className}>
					{children}
				</Link>
			);
		case "album":
			return (
				<Link to="/album/$id" params={{ id: item.id }} className={className}>
					{children}
				</Link>
			);
		case "artist":
			return (
				<Link to="/artist/$id" params={{ id: item.id }} className={className}>
					{children}
				</Link>
			);
		case "playlist":
			return (
				<Link to="/playlist/$id" params={{ id: item.id }} className={className}>
					{children}
				</Link>
			);
	}
}

// A large card for horizontal rows. `circle` is used for artists.
function MediaCard({ item, circle }: { item: HomeItem; circle: boolean }) {
	const f = fields(item);
	const imageClass = circle
		? "w-32 h-32 rounded-full object-cover"
		: "w-40 h-40 rounded-2xl object-cover";

	return (
		<ItemLink
			item={item}
			className={`flex-none flex flex-col gap-2 ${circle ? "w-32 items-center" : "w-40"}`}
		>
			{f.image ? (
				<img
					src={f.image}
					alt={f.primary}
					className={imageClass}
					style={{ viewTransitionName: `key-${f.transitionId}` }}
				/>
			) : (
				<div
					className={`${imageClass} bg-secondary flex items-center justify-center`}
				>
					<ListMusic className="w-8 h-8 text-muted-foreground" />
				</div>
			)}
			<div className={`flex flex-col ${circle ? "items-center text-center" : ""}`}>
				<span className="text-sm font-medium line-clamp-1">{f.primary}</span>
				{f.secondary ? (
					<span className="text-xs text-muted-foreground line-clamp-1">
						{f.secondary}
					</span>
				) : null}
			</div>
		</ItemLink>
	);
}

export function MediaRow({
	title,
	items,
	shape,
}: {
	title: string | null;
	items: HomeItem[];
	shape: "square" | "circle";
}) {
	return (
		<section className="flex flex-col space-y-2">
			{title ? <h2 className="text-xl font-bold">{title}</h2> : null}
			<div
				className="w-full flex gap-4 overflow-x-auto pb-1"
				style={{ scrollbarWidth: "none" }}
			>
				{items.map((item) => (
					<MediaCard key={item.id} item={item} circle={shape === "circle"} />
				))}
			</div>
		</section>
	);
}

// A compact image + name tile for the grid layout (quick picks, library shortcuts).
function TileCard({ item }: { item: HomeItem }) {
	const f = fields(item);
	return (
		<ItemLink
			item={item}
			className="flex items-center gap-3 bg-secondary/50 hover:bg-secondary rounded-lg overflow-hidden transition-colors h-12"
		>
			{f.image ? (
				<img
					src={f.image}
					alt={f.primary}
					className="w-12 h-12 flex-shrink-0 object-cover"
					style={{ viewTransitionName: `key-${f.transitionId}` }}
				/>
			) : (
				<div className="w-12 h-12 flex-shrink-0 bg-secondary flex items-center justify-center">
					<ListMusic className="w-5 h-5 text-muted-foreground" />
				</div>
			)}
			<span className="text-sm font-medium line-clamp-2 pr-2">{f.primary}</span>
		</ItemLink>
	);
}

export function MediaGrid({
	title,
	items,
}: {
	title: string | null;
	items: HomeItem[];
}) {
	return (
		<section className="flex flex-col gap-2">
			{title ? (
				<h2 className="text-lg font-semibold hidden lg:block">{title}</h2>
			) : null}
			<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
				{items.map((item) => (
					<TileCard key={item.id} item={item} />
				))}
			</div>
		</section>
	);
}
