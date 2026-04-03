import { createFileRoute, Link } from "@tanstack/react-router";
import { Music2, Disc3, ListMusic, Play } from "lucide-react";
import { useLikes } from "@/api/likes";
import { useQueueStore } from "../store/queue";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data, isLoading } = useLikes();
	const { play } = useQueueStore();

	const likedTracks =
		data?.items.filter((l) => l.itemType === "track") ?? [];
	const likedAlbums =
		data?.items.filter((l) => l.itemType === "album") ?? [];
	const likedPlaylists =
		data?.items.filter((l) => l.itemType === "playlist") ?? [];

	return (
		<div className="flex flex-col gap-8 px-8 py-6">
			{/* Mobile header */}
			<div className="lg:hidden h-16 flex items-center">
				<header className="w-full h-16 fixed top-0 left-1/2 -translate-x-1/2 z-10 backdrop-blur-md bg-background/70">
					<div className="w-full h-16 px-4 max-w-lg mx-auto flex items-center">
						<h1 className="text-2xl font-bold">Your library</h1>
					</div>
				</header>
			</div>

			{/* Desktop header */}
			<h1 className="hidden lg:block text-2xl font-bold">Your library</h1>

			{isLoading ? (
				<LibrarySkeleton />
			) : (
				<>
					{/* Liked Tracks */}
					{likedTracks.length > 0 && (
						<section className="flex flex-col gap-3">
							<div className="flex items-center gap-2">
								<Music2 className="w-4 h-4 text-muted-foreground" />
								<h2 className="text-base font-semibold">Liked Songs</h2>
								<span className="text-xs text-muted-foreground ml-1">
									{likedTracks.length}
								</span>
							</div>
							<div className="flex flex-col">
								{likedTracks.map((like, i) => (
									<button
										key={like.id}
										type="button"
										onClick={() =>
											play([
												{
													id: like.itemId,
													name: like.metadata.name,
													artists: [{ name: like.metadata.artist }],
													album: {
														id: like.itemId,
														name: "",
														image: like.metadata.image,
													},
													durationMs: 0,
												},
											])
										}
										className="flex items-center gap-3 px-3 py-2 -mx-3 rounded-lg hover:bg-white/5 transition-colors group text-left"
									>
										<span className="w-5 text-xs text-muted-foreground text-right flex-shrink-0 tabular-nums">
											<span className="group-hover:hidden">{i + 1}</span>
											<Play className="hidden group-hover:block w-3.5 h-3.5 fill-current" />
										</span>
										<img
											src={like.metadata.image}
											alt={like.metadata.name}
											className="w-9 h-9 rounded-md object-cover flex-shrink-0"
										/>
										<div className="min-w-0">
											<p className="text-sm font-medium truncate">
												{like.metadata.name}
											</p>
											<p className="text-xs text-muted-foreground truncate">
												{like.metadata.artist}
											</p>
										</div>
									</button>
								))}
							</div>
						</section>
					)}

					{/* Liked Albums */}
					{likedAlbums.length > 0 && (
						<section className="flex flex-col gap-3">
							<div className="flex items-center gap-2">
								<Disc3 className="w-4 h-4 text-muted-foreground" />
								<h2 className="text-base font-semibold">Liked Albums</h2>
								<span className="text-xs text-muted-foreground ml-1">
									{likedAlbums.length}
								</span>
							</div>
							<MediaGrid>
								{likedAlbums.map((like) => (
									<Link
										key={like.id}
										to="/album/$id"
										params={{ id: like.itemId }}
										className="flex flex-col gap-2 group"
									>
										<div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
											<img
												src={like.metadata.image}
												alt={like.metadata.name}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>
											<div className={cn(
												"absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors",
											)} />
										</div>
										<div>
											<p className="text-sm font-medium truncate">
												{like.metadata.name}
											</p>
											<p className="text-xs text-muted-foreground truncate">
												{like.metadata.artist}
											</p>
										</div>
									</Link>
								))}
							</MediaGrid>
						</section>
					)}

					{/* Liked Playlists */}
					{likedPlaylists.length > 0 && (
						<section className="flex flex-col gap-3">
							<div className="flex items-center gap-2">
								<ListMusic className="w-4 h-4 text-muted-foreground" />
								<h2 className="text-base font-semibold">Liked Playlists</h2>
								<span className="text-xs text-muted-foreground ml-1">
									{likedPlaylists.length}
								</span>
							</div>
							<MediaGrid>
								{likedPlaylists.map((like) => (
									<Link
										key={like.id}
										to="/playlist/$id"
										params={{ id: like.itemId }}
										className="flex flex-col gap-2 group"
									>
										<div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
											<img
												src={like.metadata.image}
												alt={like.metadata.name}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>
										</div>
										<div>
											<p className="text-sm font-medium truncate">
												{like.metadata.name}
											</p>
											<p className="text-xs text-muted-foreground">Playlist</p>
										</div>
									</Link>
								))}
							</MediaGrid>
						</section>
					)}

					{/* Empty state */}
					{!isLoading &&
						likedTracks.length === 0 &&
						likedAlbums.length === 0 &&
						likedPlaylists.length === 0 && (
							<div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/50">
								<Music2 className="w-12 h-12" strokeWidth={1} />
								<p className="text-sm">Nothing liked yet</p>
								<p className="text-xs">
									Heart tracks, albums, and playlists to see them here
								</p>
							</div>
						)}
				</>
			)}
		</div>
	);
}

function MediaGrid({ children }: { children: React.ReactNode }) {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
			{children}
		</div>
	);
}

function LibrarySkeleton() {
	return (
		<div className="flex flex-col gap-8">
			{[5, 4].map((count, si) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
				<section key={si} className="flex flex-col gap-3">
					<div className="h-5 w-32 bg-secondary rounded animate-pulse" />
					<div className="grid grid-cols-4 gap-4">
						{Array.from({ length: count }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<div key={i} className="flex flex-col gap-2">
								<div className="aspect-square bg-secondary rounded-xl animate-pulse" />
								<div className="h-3.5 w-3/4 bg-secondary/70 rounded animate-pulse" />
								<div className="h-3 w-1/2 bg-secondary/50 rounded animate-pulse" />
							</div>
						))}
					</div>
				</section>
			))}
		</div>
	);
}
