import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { client } from "../lib/hono-rpc";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const { data: recents } = useQuery({
		queryKey: ["recents"],
		queryFn: async () => {
			const res = await client.recents.$get();

			if (!res.ok) {
				throw new Error("Could not fetch album");
			}

			const json = await res.json();

			return json;
		},
	});
	const { data: jumpBackIn } = useQuery({
		queryKey: ["jump-back-in"],
		queryFn: async () => {
			const res = await client.recents.$get({
				query: {
					range: "long_term",
				},
			});

			if (!res.ok) {
				throw new Error("Could not fetch album");
			}

			const json = await res.json();

			return json;
		},
	});
	const { data: newReleases } = useQuery({
		queryKey: ["new-releases"],
		queryFn: async () => {
			const res = await client["new-releases"].$get();

			if (!res.ok) {
				throw new Error("Could not fetch album");
			}

			const json = await res.json();

			return json;
		},
	});

	return (
		<div className="px-4 flex flex-col space-y-6">
			<section className="grid grid-cols-2 gap-2 px-4">
				{recents?.items.slice(0, 8).map((item) => (
					<Link
						key={item.id}
						to="/album/$id"
						params={{
							id: item.album.id,
						}}
						className="w-full h-12 flex items-center space-x-3 bg-neutral-800 rounded-lg overflow-hidden"
					>
						<img
							src={item.album.images[0].url}
							alt={`${item.album.name} cover`}
							className="w-12 h-12"
							style={{
								viewTransitionName: `key-${item.album.id}`,
							}}
						/>
						<span className="text-sm line-clamp-2">{item.name}</span>
					</Link>
				))}
			</section>
			{recents && recents.items.length === 9 ? (
				<section className="px-4 flex flex-col space-y-2">
					<h2 className="text-xl font-bold">Top pick for you</h2>
					<Link
						to="/album/$id"
						params={{
							id: recents.items[8].album.id,
						}}
						className="w-full h-40 flex items-start space-x-3 bg-neutral-800 rounded-lg overflow-hidden"
					>
						<img
							src={recents.items[8].album.images[0].url}
							alt={`${recents.items[8].album.name} cover`}
							className="w-40 h-40"
							style={{
								viewTransitionName: `key-${recents.items[8].id}`,
							}}
						/>
						<div className="py-2 flex flex-col">
							<span className="text-lg">{recents.items[8].name}</span>
							<span className="text-sm text-neutral-400">
								{recents.items[8].artists[0].name}
							</span>
						</div>
					</Link>
				</section>
			) : null}
			<section className="px-4 flex flex-col space-y-2">
				<h2 className="text-xl font-bold">Jump back in</h2>
				<div
					className="w-full flex gap-4 overflow-x-scroll"
					style={{
						scrollbarWidth: "none",
					}}
				>
					{jumpBackIn?.items.map((item) => (
						<Link
							key={item.id}
							to="/album/$id"
							params={{
								id: item.album.id,
							}}
							className="w-48 h-60 flex-none flex flex-col space-y-2"
						>
							<img
								src={item.album.images[0].url}
								alt={`${item.name} cover`}
								className="w-48 h-48 rounded-lg"
								style={{
									viewTransitionName: `key-${item.id}`,
								}}
							/>
							<div className="w-full flex-1 flex flex-col">
								<span className="text-sm line-clamp-2">{item.name}</span>
								<span className="text-sm text-neutral-400">
									{item.artists[0].name}
								</span>
							</div>
						</Link>
					))}
				</div>
			</section>
			<section className="px-4 flex flex-col space-y-2">
				<h2 className="text-xl font-bold">New releases</h2>
				<div
					className="w-full flex gap-4 overflow-x-scroll"
					style={{
						scrollbarWidth: "none",
					}}
				>
					{newReleases?.albums.items.map((item) => (
						<Link
							key={item.id}
							to="/album/$id"
							params={{
								id: item.id,
							}}
							className="w-48 h-60 flex-none flex flex-col space-y-2"
						>
							<img
								src={item.images[0].url}
								alt={`${item.name} cover`}
								className="w-48 h-48 rounded-lg"
								style={{
									viewTransitionName: `key-${item.id}`,
								}}
							/>
							<div className="w-full flex-1 flex flex-col">
								<span className="text-sm line-clamp-2">{item.name}</span>
								<span className="text-sm text-neutral-400">
									{item.artists[0].name}
								</span>
							</div>
						</Link>
					))}
				</div>
			</section>
		</div>
	);
}
