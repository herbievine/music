import { createFileRoute, Link } from "@tanstack/react-router";
import { Music2 } from "lucide-react";
import { useSavedAlbums } from "@/api/albums";

export const Route = createFileRoute("/discography")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data, isLoading } = useSavedAlbums();

	const savedAlbums = data?.items ?? [];

	return (
		<div className="flex flex-col gap-8 px-8 py-6">
			{/* Mobile header */}
			<div className="lg:hidden h-16 flex items-center">
				<header className="w-full h-16 fixed top-0 left-1/2 -translate-x-1/2 z-10 backdrop-blur-md bg-background/70">
					<div className="w-full h-16 px-4 max-w-lg mx-auto flex items-center">
						<h1 className="text-2xl font-bold">Discography</h1>
					</div>
				</header>
			</div>

			{/* Desktop header */}
			<h1 className="hidden lg:block text-2xl font-bold">Discography</h1>

			{isLoading ? (
				<DiscographySkeleton />
			) : savedAlbums.length > 0 ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
					{savedAlbums.map((item) => (
						<Link
							key={item.album.id}
							to="/album/$id"
							params={{ id: item.album.id }}
							className="flex flex-col gap-2 group"
						>
							<div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
								<img
									src={item.album.images[0]?.url}
									alt={item.album.name}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
							</div>
							<div>
								<p className="text-sm font-medium truncate">{item.album.name}</p>
								<p className="text-xs text-muted-foreground truncate">{item.album.artists[0]?.name}</p>
							</div>
						</Link>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/50">
					<Music2 className="w-12 h-12" strokeWidth={1} />
					<p className="text-sm">No albums yet</p>
					<p className="text-xs">Save albums to see them here</p>
				</div>
			)}
		</div>
	);
}

function DiscographySkeleton() {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
			{Array.from({ length: 10 }).map((_, i) => (
				<div key={i} className="flex flex-col gap-2">
					<div className="aspect-square bg-secondary rounded-xl animate-pulse" />
					<div className="h-3.5 w-3/4 bg-secondary/70 rounded animate-pulse" />
					<div className="h-3 w-1/2 bg-secondary/50 rounded animate-pulse" />
				</div>
			))}
		</div>
	);
}
