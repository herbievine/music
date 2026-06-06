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

	const getToken = async () =>
		({ Authorization: `Bearer ${await session?.getToken()}` }) as Record<
			string,
			string
		>;

	const { data: recents } = useQuery({
		queryKey: ["recents"],
		queryFn: async () => {
			const res = await client.recents.$get(
				{ query: { limit: "8" } },
				{ headers: await getToken() },
			);
			if (!res.ok) throw new Error("Could not fetch recents");
			return res.json();
		},
	});

	const { data: jumpBackIn } = useQuery({
		queryKey: ["jump-back-in"],
		queryFn: async () => {
			const res = await client["jump-back-in"].$get(
				{},
				{ headers: await getToken() },
			);
			if (!res.ok) throw new Error("Could not fetch jump back in");
			return res.json();
		},
	});

	const { data: recentArtists } = useQuery({
		queryKey: ["recents", "artist"],
		queryFn: async () => {
			const res = await client.recents.$get(
				{ query: { type: "artist", limit: "10" } },
				{ headers: await getToken() },
			);
			if (!res.ok) throw new Error("Could not fetch recent artists");
			return res.json();
		},
	});

	const { data: frequentlyPlayed } = useQuery({
		queryKey: ["frequently-played"],
		queryFn: async () => {
			const res = await client["frequently-played"].$get(
				{ query: { limit: "8" } },
				{ headers: await getToken() },
			);
			if (!res.ok) throw new Error("Could not fetch frequently played");
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
						{(recents.items as Track[]).slice(0, 8).map((item) => (
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

			{/* Jump back in */}
			{jumpBackIn && jumpBackIn.items.length > 0 && (
				<AlbumRows
					title="Jump back in"
					albumOrPlaylists={jumpBackIn.items as Album[]}
				/>
			)}

			{/* Recently played artists */}
			{recentArtists && recentArtists.items.length > 0 && (
				<section className="flex flex-col space-y-2">
					<h2 className="text-xl font-bold">Your artists</h2>
					<div
						className="w-full flex gap-4 overflow-x-auto pb-1"
						style={{ scrollbarWidth: "none" }}
					>
						{(recentArtists.items as Artist[]).map((artist) => (
							<Link
								key={artist.id}
								to="/artist/$id"
								params={{ id: artist.id }}
								className="w-32 flex-none flex flex-col gap-2 items-center"
							>
								{artist.images[0] ? (
									<img
										src={artist.images[0].url}
										alt={artist.name}
										className="w-32 h-32 rounded-full object-cover"
									/>
								) : (
									<div className="w-32 h-32 rounded-full bg-secondary" />
								)}
								<span className="text-sm font-medium text-center line-clamp-1">
									{artist.name}
								</span>
							</Link>
						))}
					</div>
				</section>
			)}

			{/* Frequently played */}
			{frequentlyPlayed && frequentlyPlayed.items.length > 0 && (
				<section className="flex flex-col space-y-2">
					<h2 className="text-xl font-bold">Frequently played</h2>
					<div
						className="w-full flex gap-4 overflow-x-auto pb-1"
						style={{ scrollbarWidth: "none" }}
					>
						{(frequentlyPlayed.items as Track[]).map((item) => (
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
		</div>
	);
}

type Track = {
	id: string;
	name: string;
	artists: { id: string; name: string }[];
	album: {
		id: string;
		name: string;
		images: { url: string }[];
		releaseDate: string;
	};
	durationMs: number;
	type: "track";
};

type Album = {
	id: string;
	name: string;
	artists: { id: string; name: string }[];
	images: { url: string }[];
	releaseDate: string;
	type: "album";
};

type Artist = {
	id: string;
	name: string;
	images: { url: string }[];
	type: "artist";
};

function getTimeOfDay() {
	const h = new Date().getHours();
	if (h < 12) return " morning";
	if (h < 17) return " afternoon";
	return " evening";
}
