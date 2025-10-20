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
import cn from "../utils/cn";

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
	const { data, isLoading } = useQuery({
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

			if (!res.ok) {
				throw new Error("api error");
			}

			const json = await res.json();

			return json;
		},
		enabled: debouncedSearchTerm.length > 0,
	});

	// if (query !== debouncedSearchTerm || isLoading) {
	// 	return (
	// 		<ul className="flex flex-col space-y-6">
	// 			{[...new Array(12).fill("0")].map((_, i) => (
	// 				<li key={i} className="flex space-x-4 items-center">
	// 					<div className="w-12 h-12 bg-zinc-800 rounded-lg animate-pulse" />
	// 					<div className="flex flex-col items-start space-y-2">
	// 						<div className="h-5 w-40 bg-zinc-800 rounded-2xl animate-pulse" />
	// 						<div className="h-4 w-52 bg-zinc-800 rounded-2xl animate-pulse" />
	// 					</div>
	// 				</li>
	// 			))}
	// 		</ul>
	// 	);
	// }

	// if (!data || data.length === 0) {
	// 	return <span>No results :(</span>;
	// }

	return (
		<div className="flex flex-col overflow-hidden">
			<div className="h-24 flex items-center">
				<header
					className={cn(
						"w-full h-24",
						"fixed top-0 left-1/2 -translate-x-1/2",
						"z-10 backdrop-blur-md bg-neutral-900/70",
					)}
				>
					<div className="w-full h-24 px-4 max-w-lg mx-auto flex flex-col justify-center space-y-2">
						<input
							type="text"
							placeholder="Search..."
							className="w-full px-4 py-2 rounded-xl text-zinc-100 bg-zinc-800 outline-none"
							value={query ?? ""}
							onChange={(e) => {
								setValues({ query: e.target.value });
							}}
						/>
						<div className="w-full flex items-center space-x-2">
							{(["track", "album", "artist", "playlist"] as const).map(
								(typeName) => (
									<button
										key={typeName}
										type="button"
										onClick={() => {
											setValues({ type: typeName });
										}}
										className={cn(
											"px-2.5 py-0.5 text-sm rounded-full capitalize",
											type === typeName ? "border border-neutral-700" : "",
										)}
									>
										{typeName}
									</button>
								),
							)}
						</div>
					</div>
				</header>
			</div>
			<ul className="flex flex-col space-y-6">
				{data?.results.map((result) =>
					result.type === "track" ? (
						<li key={result.id} className="flex space-x-2">
							<Link
								to="/album/$id"
								params={{
									id: result.album.id,
								}}
								className="flex space-x-4 items-center"
							>
								{!!result.album.images && result.album.images.length > 0 ? (
									<img
										src={result.album.images[0].url}
										alt={`${result.album.name} cover`}
										className="w-12 h-12 rounded-lg"
										style={{
											viewTransitionName: `key-${result.album.id}`,
										}}
									/>
								) : null}
								<div className="flex flex-col items-start">
									<span className="line-clamp-1 text-left">{result.name}</span>
									<span className="text-sm text-zinc-500">
										{dayjs(result.album.release_date).format("YYYY")}
									</span>
								</div>
							</Link>
						</li>
					) : result.type === "album" ? (
						<li key={result.id} className="flex space-x-2">
							<Link
								to="/album/$id"
								params={{
									id: result.id,
								}}
								className="flex space-x-4 items-center"
							>
								{!!result.images && result.images.length > 0 ? (
									<img
										src={result.images[0].url}
										alt={`${result.name} cover`}
										className="w-12 h-12 rounded-lg"
										style={{
											viewTransitionName: `key-${result.id}`,
										}}
									/>
								) : null}
								<div className="flex flex-col items-start">
									<span className="line-clamp-1 text-left">{result.name}</span>
									<span className="text-sm text-zinc-500">
										{dayjs(result.release_date).format("YYYY")}
									</span>
								</div>
							</Link>
						</li>
					) : result.type === "playlist" ? (
						<li key={result.id} className="flex space-x-2">
							<Link
								to="/playlist/$id"
								params={{
									id: result.id,
								}}
								className="flex space-x-4 items-center"
							>
								{!!result.images && result.images.length > 0 ? (
									<img
										src={result.images[0].url}
										alt={`${result.name} cover`}
										className="w-12 h-12 rounded-lg"
										style={{
											viewTransitionName: `key-${result.id}`,
										}}
									/>
								) : null}
								<div className="flex flex-col items-start">
									<span className="line-clamp-1 text-left">{result.name}</span>
								</div>
							</Link>
						</li>
					) : (
						<li key={result.id} className="flex space-x-2">
							<Link
								to="/playlist/$id"
								params={{
									id: result.id,
								}}
								className="flex space-x-4 items-center"
							>
								{!!result.images && result.images.length > 0 ? (
									<img
										src={result.images[0].url}
										alt={result.name}
										className="w-12 h-12 rounded-lg"
										style={{
											viewTransitionName: `key-${result.id}`,
										}}
									/>
								) : null}
								<div className="flex flex-col items-start">
									<span className="line-clamp-1 text-left">{result.name}</span>
								</div>
							</Link>
						</li>
					),
				)}
			</ul>
		</div>
	);
}
