import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Music2 } from "lucide-react";
import { useSavedAlbums } from "@/api/albums";

export const Route = createFileRoute("/discography")({
	component: RouteComponent,
});

const PAGE_SIZE = 15;

function RouteComponent() {
	const [offset, setOffset] = useState(0);
	const { data, isLoading } = useSavedAlbums(offset);

	const savedAlbums = data?.items ?? [];
	const total = data?.total ?? 0;
	const hasPrev = offset > 0;
	const hasNext = offset + PAGE_SIZE < total;

	return (
		<div className="flex flex-col gap-8 px-4 sm:px-8 py-2 sm:py-6">
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
				<>
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
					<Pagination
						offset={offset}
						total={total}
						pageSize={PAGE_SIZE}
						hasPrev={hasPrev}
						hasNext={hasNext}
						onPrev={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
						onNext={() => setOffset((o) => o + PAGE_SIZE)}
					/>
				</>
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

function Pagination({
	offset,
	total,
	pageSize,
	hasPrev,
	hasNext,
	onPrev,
	onNext,
}: {
	offset: number;
	total: number;
	pageSize: number;
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
}) {
	const from = offset + 1;
	const to = Math.min(offset + pageSize, total);

	return (
		<div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onPrev}
					disabled={!hasPrev}
					className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
				>
					<ChevronLeft className="w-4 h-4" />
				</button>
				<span className="px-2">{from}–{to} of {total}</span>
				<button
					type="button"
					onClick={onNext}
					disabled={!hasNext}
					className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
				>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

function DiscographySkeleton() {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
			{Array.from({ length: PAGE_SIZE }).map((_, i) => (
				<div key={i} className="flex flex-col gap-2">
					<div className="aspect-square bg-secondary rounded-xl animate-pulse" />
					<div className="h-3.5 w-3/4 bg-secondary/70 rounded animate-pulse" />
					<div className="h-3 w-1/2 bg-secondary/50 rounded animate-pulse" />
				</div>
			))}
		</div>
	);
}
