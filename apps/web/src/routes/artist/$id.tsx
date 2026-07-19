import { useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import {
	Link,
	createFileRoute,
	useCanGoBack,
	useNavigate,
	useParams,
	useRouter,
} from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { client } from "../../lib/hono-rpc";

export const Route = createFileRoute("/artist/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const navigate = useNavigate();
	const { session } = useClerk();
	const { id } = useParams({ from: "/artist/$id" });

	const { data } = useQuery({
		queryKey: ["artist", id],
		queryFn: async () => {
			const res = await client.artists[":id"].$get(
				{ param: { id } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Could not fetch artist");
			return res.json();
		},
	});

	const { data: thisIsPlaylist } = useQuery({
		queryKey: ["artist-this-is", id],
		queryFn: async () => {
			const res = await client.artists[":id"]["this-is-playlist"].$get(
				{ param: { id } },
				{ headers: { Authorization: `Bearer ${await session?.getToken()}` } },
			);
			if (!res.ok) throw new Error("Could not fetch This Is playlist");
			return res.json();
		},
	});

	const imageUrl = data?.images?.[0]?.url;

	return (
		<div className="flex flex-col">
			{/* Hero */}
			<div className="relative">
				{imageUrl && (
					<div
						className="absolute inset-0 overflow-hidden pointer-events-none"
						aria-hidden
					>
						<img
							src={imageUrl}
							className="w-full h-full object-cover scale-110 blur-3xl opacity-60 saturate-150"
						/>
						<div className="absolute inset-0 bg-gradient-to-b from-black/30 via-card/80 to-card" />
					</div>
				)}

				<button
					type="button"
					onClick={() =>
						canGoBack ? router.history.back() : navigate({ to: "/" })
					}
					className="relative z-10 m-6 mb-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
				>
					<ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
				</button>

				<div className="relative z-10 px-4 sm:px-8 pt-6 pb-8 flex flex-col sm:flex-row sm:items-end gap-6">
					{imageUrl ? (
						<img
							src={imageUrl}
							alt={data?.name}
							className="w-48 h-48 rounded-full shadow-2xl flex-shrink-0 object-cover"
							style={{ viewTransitionName: `key-${id}` }}
						/>
					) : (
						<div className="w-48 h-48 rounded-full bg-secondary flex-shrink-0 animate-pulse" />
					)}

					<div className="pb-1 min-w-0">
						<p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">
							Artist
						</p>
						{data ? (
							<h1 className="text-4xl lg:text-5xl font-black text-white leading-none mb-4 truncate">
								{data.name}
							</h1>
						) : (
							<div className="h-12 w-64 bg-white/20 rounded-lg animate-pulse mb-4" />
						)}
						{data && (
							<p className="text-sm text-white/70">
								{data.albums.length} album{data.albums.length !== 1 ? "s" : ""}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* This Is playlist */}
			{thisIsPlaylist && (
				<div className="px-4 sm:px-8 pt-2 pb-6">
					<Link
						to="/playlist/$id"
						params={{ id: thisIsPlaylist.id }}
						className="flex items-center gap-5 p-5 rounded-2xl bg-secondary/40 hover:bg-secondary/60 transition-colors w-full"
					>
						{thisIsPlaylist.images?.[0] && (
							<img
								src={thisIsPlaylist.images[0].url}
								alt={thisIsPlaylist.name}
								className="w-20 h-20 flex-shrink-0 object-cover rounded-xl shadow-lg"
							/>
						)}
						<div className="flex flex-col min-w-0">
							<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
								Playlist
							</span>
							<span className="text-xl font-bold line-clamp-1">
								{thisIsPlaylist.name}
							</span>
						</div>
					</Link>
				</div>
			)}

			{/* Albums grid */}
			<div className="px-4 sm:px-8 pb-8">
				{data ? (
					data.albums.length > 0 ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
							{data.albums.map((album) => {
								const year = album.releaseDate.slice(0, 4);
								return (
									<Link
										key={album.id}
										to="/album/$id"
										params={{ id: album.id }}
										className="group cursor-pointer"
									>
										<div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
											{album.images?.[0] ? (
												<img
													src={album.images[0].url}
													alt={album.name}
													className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
													style={{ viewTransitionName: `key-${album.id}` }}
												/>
											) : (
												<div className="w-full h-full bg-secondary" />
											)}
										</div>
										<p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
											{album.name}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{year}
										</p>
									</Link>
								);
							})}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							No albums found
						</div>
					)
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
						{[...Array(12)].map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<div key={i}>
								<div className="aspect-square bg-secondary rounded-lg animate-pulse mb-3" />
								<div className="h-4 bg-secondary rounded animate-pulse mb-2" />
								<div className="h-3 w-2/3 bg-secondary/60 rounded animate-pulse" />
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
