import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
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

const searchParams = {
	query: parseAsString.withDefault(""),
	type: parseAsStringEnum(["album", "track", "artist", "playlist"]).withDefault(
		"track",
	),
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
	const debouncedSearchTerm = useDebounce(query, 300);
	const { data } = useQuery({
		queryKey: ["search", debouncedSearchTerm, type],
		queryFn: async () => {
			const res = await client.search.$get(
				{
					query: {
						q: debouncedSearchTerm,
						type,
					},
				},
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);
			if (!res.ok) throw new Error("api error");
			return res.json();
		},
		enabled: debouncedSearchTerm.length > 0,
	});

	return (
		<div className="flex flex-col gap-4 px-8 py-6">
			{/* Mobile header */}
			<div className="lg:hidden h-24 flex items-center">
				<header className="w-full h-24 fixed top-0 left-1/2 -translate-x-1/2 z-10 backdrop-blur-md bg-background/70">
					<div className="w-full h-24 px-4 max-w-lg mx-auto flex flex-col justify-center gap-2">
						<SearchInput query={query} setQuery={(q) => setValues({ query: q })} />
						<TypePills type={type} setType={(t) => setValues({ type: t })} />
					</div>
				</header>
			</div>

			{/* Desktop header */}
			<div className="hidden lg:flex flex-col gap-3">
				<h1 className="text-2xl font-bold">Search</h1>
				<SearchInput query={query} setQuery={(q) => setValues({ query: q })} />
				<TypePills type={type} setType={(t) => setValues({ type: t })} />
			</div>

			<ul className="flex flex-col gap-4">
				{data?.results.map((result) =>
					result.type === "track" ? (
						<li key={result.id}>
							<Link
								to="/album/$id"
								params={{ id: result.album.id }}
								className="flex items-center gap-4 hover:bg-secondary/50 rounded-lg p-2 transition-colors"
							>
								{result.album.images?.length > 0 && (
									<img
										src={result.album.images[0].url}
										alt={`${result.album.name} cover`}
										className="w-12 h-12 rounded-lg flex-shrink-0 object-cover"
										style={{ viewTransitionName: `key-${result.album.id}` }}
									/>
								)}
								<div className="flex flex-col min-w-0">
									<span className="font-medium line-clamp-1">{result.name}</span>
									<span className="text-sm text-muted-foreground">
										{result.artists?.[0]?.name} · {dayjs(result.album.releaseDate).format("YYYY")}
									</span>
								</div>
							</Link>
						</li>
					) : result.type === "album" ? (
						<li key={result.id}>
							<Link
								to="/album/$id"
								params={{ id: result.id }}
								className="flex items-center gap-4 hover:bg-secondary/50 rounded-lg p-2 transition-colors"
							>
								{result.images?.length > 0 && (
									<img
										src={result.images[0].url}
										alt={`${result.name} cover`}
										className="w-12 h-12 rounded-lg flex-shrink-0 object-cover"
										style={{ viewTransitionName: `key-${result.id}` }}
									/>
								)}
								<div className="flex flex-col min-w-0">
									<span className="font-medium line-clamp-1">{result.name}</span>
									<span className="text-sm text-muted-foreground">
										Album · {dayjs(result.releaseDate).format("YYYY")}
									</span>
								</div>
							</Link>
						</li>
					) : result.type === "playlist" ? (
						<li key={result.id}>
							<Link
								to="/playlist/$id"
								params={{ id: result.id }}
								className="flex items-center gap-4 hover:bg-secondary/50 rounded-lg p-2 transition-colors"
							>
								{result.images?.length > 0 && (
									<img
										src={result.images[0].url}
										alt={`${result.name} cover`}
										className="w-12 h-12 rounded-lg flex-shrink-0 object-cover"
										style={{ viewTransitionName: `key-${result.id}` }}
									/>
								)}
								<div className="flex flex-col min-w-0">
									<span className="font-medium line-clamp-1">{result.name}</span>
									<span className="text-sm text-muted-foreground">Playlist</span>
								</div>
							</Link>
						</li>
					) : (
						<li key={result.id}>
							<div className="flex items-center gap-4 p-2">
								{result.images?.length > 0 && (
									<img
										src={result.images[0].url}
										alt={result.name}
										className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
										style={{ viewTransitionName: `key-${result.id}` }}
									/>
								)}
								<div className="flex flex-col min-w-0">
									<span className="font-medium line-clamp-1">{result.name}</span>
									<span className="text-sm text-muted-foreground">Artist</span>
								</div>
							</div>
						</li>
					),
				)}
			</ul>
		</div>
	);
}

function SearchInput({
	query,
	setQuery,
}: {
	query: string;
	setQuery: (q: string) => void;
}) {
	return (
		<input
			type="text"
			placeholder="Search..."
			className="w-full px-4 py-2.5 rounded-xl text-foreground bg-secondary/70 outline-none border border-border focus:border-ring transition-colors placeholder:text-muted-foreground"
			value={query}
			onChange={(e) => setQuery(e.target.value)}
		/>
	);
}

function TypePills({
	type,
	setType,
}: {
	type: string;
	setType: (t: "album" | "track" | "artist" | "playlist") => void;
}) {
	return (
		<div className="flex items-center gap-2">
			{(["track", "album", "artist", "playlist"] as const).map((typeName) => (
				<button
					key={typeName}
					type="button"
					onClick={() => setType(typeName)}
					className={cn(
						"px-3 py-1 text-sm rounded-full capitalize transition-colors",
						type === typeName
							? "bg-secondary text-foreground border border-border"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{typeName}
				</button>
			))}
		</div>
	);
}
