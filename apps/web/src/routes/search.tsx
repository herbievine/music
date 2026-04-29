import { useClerk } from "@clerk/clerk-react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useDebounce } from "@uidotdev/usehooks";
import dayjs from "dayjs";
import {
	createStandardSchemaV1,
	parseAsString,
	parseAsStringEnum,
	useQueryStates,
} from "nuqs";
import { client } from "../lib/hono-rpc";
import { cn } from "@/lib/utils";
const TYPES = ["track", "album", "artist", "playlist"] as const;
type SearchType = (typeof TYPES)[number];

type TrackResult = {
	type: "track";
	id: string;
	name: string;
	album: { id: string; name: string; images: { url: string }[]; releaseDate: string };
	artists: { id: string; name: string }[];
};
type AlbumResult = {
	type: "album";
	id: string;
	name: string;
	images: { url: string }[];
	releaseDate: string;
	artists: { id: string; name: string }[];
};
type ArtistResult = {
	type: "artist";
	id: string;
	name: string;
	images: { url: string }[];
};
type PlaylistResult = {
	type: "playlist";
	id: string;
	name: string;
	images: { url: string }[];
};
type SearchResult = TrackResult | AlbumResult | ArtistResult | PlaylistResult;

const searchParams = {
	query: parseAsString.withDefault(""),
	type: parseAsStringEnum([...TYPES]),
};

export const Route = createFileRoute("/search")({
	component: RouteComponent,
	validateSearch: createStandardSchemaV1(searchParams, {
		partialOutput: true,
	}),
});

function RouteComponent() {
	const { session } = useClerk();
	const [{ query, type }, setValues] = useQueryStates(searchParams);
	const debouncedQ = useDebounce(query, 300);
	const isFiltered = type !== null;

	const getToken = () => session?.getToken();

	// All-mode: 4 parallel queries (one per type)
	const allQueries = useQueries({
		queries: TYPES.map((t) => ({
			queryKey: ["search", debouncedQ, t],
			queryFn: async () => {
				const res = await client.search.$get(
					{ query: { q: debouncedQ, type: t } },
					{ headers: { Authorization: `Bearer ${await getToken()}` } },
				);
				if (!res.ok) throw new Error("api error");
				return res.json();
			},
			enabled: debouncedQ.length > 0 && !isFiltered,
		})),
	});

	// Filtered mode: single query
	const { data: filteredData } = useQuery({
		queryKey: ["search", debouncedQ, type],
		queryFn: async () => {
			const res = await client.search.$get(
				{ query: { q: debouncedQ, type: type! } },
				{ headers: { Authorization: `Bearer ${await getToken()}` } },
			);
			if (!res.ok) throw new Error("api error");
			return res.json();
		},
		enabled: debouncedQ.length > 0 && isFiltered,
	});

	const [tracksQ, albumsQ, artistsQ, playlistsQ] = allQueries;
	const tracks = (tracksQ.data?.results ?? []) as SearchResult[];
	const albums = (albumsQ.data?.results ?? []) as SearchResult[];
	const artists = (artistsQ.data?.results ?? []) as SearchResult[];
	const playlists = (playlistsQ.data?.results ?? []) as SearchResult[];

	// Pick the best top result
	const topResult = (() => {
		if (isFiltered || !debouncedQ) return null;
		const q = debouncedQ.toLowerCase().trim();
		const exactArtist = artists.find((a) => a.name.toLowerCase() === q);
		return exactArtist ?? artists[0] ?? tracks[0] ?? albums[0] ?? null;
	})();

	const setType = (t: SearchType) => setValues({ type: t });

	const headerContent = (
		<>
			<SearchInput
				query={query}
				setQuery={(q) => setValues({ query: q })}
			/>
			{isFiltered && (
				<TypePills
					type={type}
					setType={setType}
					onBack={() => setValues({ type: null })}
				/>
			)}
		</>
	);

	return (
		<div className="flex flex-col gap-4 px-4 sm:px-8 py-6">
			{/* Mobile header */}
			<div className="lg:hidden flex items-center" style={{ height: isFiltered ? 80 : 56 }}>
				<header className="w-full fixed top-0 left-0 right-0 z-10 backdrop-blur-md bg-background/70 px-4 pt-3 pb-2 flex flex-col gap-2">
					{headerContent}
				</header>
			</div>

			{/* Desktop header */}
			<div className="hidden lg:flex flex-col gap-3">
				<h1 className="text-2xl font-bold">Search</h1>
				{headerContent}
			</div>

			{debouncedQ && (
				isFiltered ? (
					<FilteredResults results={(filteredData?.results ?? []) as SearchResult[]} />
				) : (
					<AllResults
						topResult={topResult}
						tracks={tracks}
						albums={albums}
						artists={artists}
						playlists={playlists}
						onShowMore={setType}
					/>
				)
			)}
		</div>
	);
}

// ─── All-mode ────────────────────────────────────────────────────────────────

function AllResults({
	topResult,
	tracks,
	albums,
	artists,
	playlists,
	onShowMore,
}: {
	topResult: SearchResult | null;
	tracks: SearchResult[];
	albums: SearchResult[];
	artists: SearchResult[];
	playlists: SearchResult[];
	onShowMore: (type: SearchType) => void;
}) {
	const hasAny =
		topResult || tracks.length || albums.length || artists.length || playlists.length;

	if (!hasAny) return null;

	return (
		<div className="flex flex-col gap-8">
			{topResult && <TopResultCard result={topResult} />}

			{artists.length > 0 && (
				<Section title="Artists" onShowMore={() => onShowMore("artist")}>
					{artists.slice(0, 5).map((r) => (
						<ResultRow key={r.id} result={r} />
					))}
				</Section>
			)}

			{tracks.length > 0 && (
				<Section title="Songs" onShowMore={() => onShowMore("track")}>
					{tracks.slice(0, 5).map((r) => (
						<ResultRow key={r.id} result={r} />
					))}
				</Section>
			)}

			{albums.length > 0 && (
				<Section title="Albums" onShowMore={() => onShowMore("album")}>
					{albums.slice(0, 5).map((r) => (
						<ResultRow key={r.id} result={r} />
					))}
				</Section>
			)}

			{playlists.length > 0 && (
				<Section title="Playlists" onShowMore={() => onShowMore("playlist")}>
					{playlists.slice(0, 5).map((r) => (
						<ResultRow key={r.id} result={r} />
					))}
				</Section>
			)}
		</div>
	);
}

function TopResultCard({ result }: { result: SearchResult }) {
	const image =
		result.type === "track"
			? result.album.images?.[0]?.url
			: result.images?.[0]?.url;

	const subtitle =
		result.type === "artist"
			? "Artist"
			: result.type === "track"
				? `Song · ${result.artists?.[0]?.name ?? ""}`
				: result.type === "album"
					? `Album · ${dayjs(result.releaseDate).format("YYYY")}`
					: "Playlist";

	const inner = (
		<div className="flex items-center gap-5 p-5 rounded-2xl bg-secondary/40 hover:bg-secondary/60 transition-colors w-full">
			{image && (
				<img
					src={image}
					alt={result.name}
					className={cn(
						"w-20 h-20 flex-shrink-0 object-cover shadow-lg",
						result.type === "artist" ? "rounded-full" : "rounded-xl",
					)}
				/>
			)}
			<div className="flex flex-col min-w-0">
				<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
					Top result
				</span>
				<span className="text-2xl font-bold line-clamp-1">{result.name}</span>
				<span className="text-sm text-muted-foreground mt-1">{subtitle}</span>
			</div>
		</div>
	);

	if (result.type === "track") {
		return (
			<Link to="/album/$id" params={{ id: result.album.id }}>
				{inner}
			</Link>
		);
	}
	if (result.type === "album") {
		return (
			<Link to="/album/$id" params={{ id: result.id }}>
				{inner}
			</Link>
		);
	}
	if (result.type === "playlist") {
		return (
			<Link to="/playlist/$id" params={{ id: result.id }}>
				{inner}
			</Link>
		);
	}
	if (result.type === "artist") {
		return (
			<Link to="/artist/$id" params={{ id: result.id }}>
				{inner}
			</Link>
		);
	}
	return inner;
}

function Section({
	title,
	onShowMore,
	children,
}: {
	title: string;
	onShowMore: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">{title}</h2>
				<button
					type="button"
					onClick={onShowMore}
					className="text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					Show more
				</button>
			</div>
			<ul className="flex flex-col">{children}</ul>
		</div>
	);
}

// ─── Filtered mode ────────────────────────────────────────────────────────────

function FilteredResults({ results }: { results: SearchResult[] }) {
	return (
		<ul className="flex flex-col">
			{results.map((result) => (
				<ResultRow key={result.id} result={result} />
			))}
		</ul>
	);
}

// ─── Shared row ───────────────────────────────────────────────────────────────

function ResultRow({ result }: { result: SearchResult }) {
	const inner = (
		<div className="flex items-center gap-4 hover:bg-secondary/50 rounded-lg p-2 transition-colors cursor-pointer">
			{result.type === "track" ? (
				result.album.images?.length > 0 && (
					<img
						src={result.album.images[0].url}
						alt={result.album.name}
						className="w-12 h-12 rounded-lg flex-shrink-0 object-cover"
					/>
				)
			) : result.images?.length > 0 ? (
				<img
					src={result.images[0].url}
					alt={result.name}
					className={cn(
						"w-12 h-12 flex-shrink-0 object-cover",
						result.type === "artist" ? "rounded-full" : "rounded-lg",
					)}
				/>
			) : null}
			<div className="flex flex-col min-w-0">
				<span className="font-medium line-clamp-1">{result.name}</span>
				<span className="text-sm text-muted-foreground line-clamp-1">
					{result.type === "track"
						? `${result.artists?.[0]?.name ?? ""} · ${dayjs(result.album.releaseDate).format("YYYY")}`
						: result.type === "album"
							? `Album · ${dayjs(result.releaseDate).format("YYYY")}`
							: result.type === "artist"
								? "Artist"
								: "Playlist"}
				</span>
			</div>
		</div>
	);

	if (result.type === "track") {
		return (
			<li>
				<Link to="/album/$id" params={{ id: result.album.id }}>
					{inner}
				</Link>
			</li>
		);
	}
	if (result.type === "album") {
		return (
			<li>
				<Link to="/album/$id" params={{ id: result.id }}>
					{inner}
				</Link>
			</li>
		);
	}
	if (result.type === "playlist") {
		return (
			<li>
				<Link to="/playlist/$id" params={{ id: result.id }}>
					{inner}
				</Link>
			</li>
		);
	}
	// artist
	return (
		<li>
			<Link to="/artist/$id" params={{ id: result.id }}>
				{inner}
			</Link>
		</li>
	);
}

// ─── Search input ─────────────────────────────────────────────────────────────

function SearchInput({
	query,
	setQuery,
}: {
	query: string;
	setQuery: (q: string) => void;
}) {
	return (
		<input
			// biome-ignore lint/a11y/noAutofocus: intentional — navigating here via Cmd/Ctrl+K implies intent to search
			autoFocus
			type="text"
			placeholder="Search..."
			className="w-full px-4 py-2.5 rounded-xl text-foreground bg-secondary/70 outline-none border border-border focus:border-ring transition-colors placeholder:text-muted-foreground"
			value={query}
			onChange={(e) => setQuery(e.target.value)}
		/>
	);
}

// ─── Type pills (filtered mode) ───────────────────────────────────────────────

function TypePills({
	type,
	setType,
	onBack,
}: {
	type: SearchType;
	setType: (t: SearchType) => void;
	onBack: () => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={onBack}
				className="px-3 py-1 text-sm rounded-full text-muted-foreground hover:text-foreground transition-colors"
			>
				← All
			</button>
			{TYPES.map((t) => (
				<button
					key={t}
					type="button"
					onClick={() => setType(t)}
					className={cn(
						"px-3 py-1 text-sm rounded-full capitalize transition-colors",
						type === t
							? "bg-secondary text-foreground border border-border"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{t}
				</button>
			))}
		</div>
	);
}
