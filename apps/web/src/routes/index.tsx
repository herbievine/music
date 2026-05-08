import { UserButton, useClerk, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlbumRows } from "../components/album-rows";
import { client } from "../lib/hono-rpc";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const { session } = useClerk();
	const { user } = useUser();
	const { data: recents } = useQuery({
		queryKey: ["recents"],
		queryFn: async () => {
			const res = await client.recents.$get(
				{ query: {} },
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);
			if (!res.ok) throw new Error("Could not fetch recents");
			return res.json();
		},
	});
	const { data: jumpBackIn } = useQuery({
		queryKey: ["jump-back-in"],
		queryFn: async () => {
			const res = await client.recents.$get(
				{ query: { range: "long_term" } },
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);
			if (!res.ok) throw new Error("Could not fetch jump back in");
			return res.json();
		},
	});
	const { data: newReleases } = useQuery({
		queryKey: ["new-releases"],
		queryFn: async () => {
			const res = await client["new-releases"].$get(
				{},
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);
			if (!res.ok) throw new Error("Could not fetch new releases");
			return res.json();
		},
	});

	return (
		<div className="flex flex-col gap-6 px-4 sm:px-8 py-2 sm:py-6">
			{/* Mobile header */}
			<div className="lg:hidden h-16 flex items-center">
				<header className="w-full h-16 fixed top-0 left-1/2 -translate-x-1/2 z-10 backdrop-blur-md bg-background/70">
					<div className="w-full h-16 px-4 max-w-lg mx-auto flex items-center justify-between">
						<h1 className="text-2xl font-bold">Hi {user?.firstName} :)</h1>
						<UserButton />
					</div>
				</header>
			</div>

			{/* Desktop header */}
			<div className="hidden lg:block">
				<h1 className="text-2xl font-bold">
					Good{getTimeOfDay()}, {user?.firstName}
				</h1>
			</div>

			{/* Quick picks grid */}
			{recents && recents.items.length > 0 && (
				<section className="flex flex-col gap-2">
					<h2 className="text-lg font-semibold hidden lg:block">Quick picks</h2>
					<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
						{recents.items.slice(0, 8).map((item) => (
							<Link
								key={item.id}
								to="/album/$id"
								params={{ id: item.album.id }}
								className="flex items-center gap-3 bg-secondary/50 hover:bg-secondary rounded-lg overflow-hidden transition-colors h-12"
							>
								<img
									src={item.album.images[0].url}
									alt={`${item.album.name} cover`}
									className="w-12 h-12 flex-shrink-0 object-cover"
									style={{ viewTransitionName: `key-${item.album.id}` }}
								/>
								<span className="text-sm font-medium line-clamp-2 pr-2">
									{item.name}
								</span>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* Top pick */}
			{recents && recents.items.length === 9 && (
				<section className="flex flex-col gap-2">
					<h2 className="text-lg font-semibold">Top pick for you</h2>
					<Link
						to="/album/$id"
						params={{ id: recents.items[8].album.id }}
						className="flex items-start gap-4 bg-secondary/50 hover:bg-secondary rounded-xl overflow-hidden transition-colors w-full max-w-xs h-32"
					>
						<img
							src={recents.items[8].album.images[0].url}
							alt={`${recents.items[8].album.name} cover`}
							className="w-32 h-32 flex-shrink-0 object-cover"
							style={{ viewTransitionName: `key-${recents.items[8].id}` }}
						/>
						<div className="py-3 flex flex-col gap-1">
							<span className="font-medium">{recents.items[8].name}</span>
							<span className="text-sm text-muted-foreground">
								{recents.items[8].artists[0].name}
							</span>
						</div>
					</Link>
				</section>
			)}

			{/* Jump back in */}
			{jumpBackIn && jumpBackIn.items.length > 0 && (
				<section className="flex flex-col gap-2">
					<h2 className="text-lg font-semibold">Jump back in</h2>
					<div
						className="flex gap-4 overflow-x-auto pb-1"
						style={{ scrollbarWidth: "none" }}
					>
						{jumpBackIn.items.map((item) => (
							<Link
								key={item.id}
								to="/album/$id"
								params={{ id: item.album.id }}
								className="w-40 flex-none flex flex-col gap-2"
							>
								<img
									src={item.album.images[0].url}
									alt={item.name}
									className="w-40 h-40 rounded-xl object-cover"
									style={{ viewTransitionName: `key-${item.album.id}` }}
								/>
								<div className="flex flex-col">
									<span className="text-sm font-medium line-clamp-1">
										{item.name}
									</span>
									<span className="text-xs text-muted-foreground">
										{item.artists[0].name}
									</span>
								</div>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* New releases */}
			{newReleases?.items && (
				<AlbumRows title="New releases" albumOrPlaylists={newReleases.items} />
			)}
		</div>
	);
}

function getTimeOfDay() {
	const h = new Date().getHours();
	if (h < 12) return " morning";
	if (h < 17) return " afternoon";
	return " evening";
}
