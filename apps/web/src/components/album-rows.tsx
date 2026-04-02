import type { MusicAlbumSummary, MusicPlaylistSummary } from "@music/api";
import { Link } from "@tanstack/react-router";

type Props = {
	title: string;
	albumOrPlaylists: (MusicAlbumSummary | MusicPlaylistSummary)[];
};

export function AlbumRows({ title, albumOrPlaylists }: Props) {
	return (
		<section className="flex flex-col space-y-2">
			<h2 className="text-xl font-bold">{title}</h2>
			<div
				className="w-full flex gap-4 overflow-x-scroll overflow-y-hidden"
				style={{
					scrollbarWidth: "none",
				}}
			>
				{albumOrPlaylists.map((item) => (
					<Link
						key={item.id}
						to={item.type === "album" ? "/album/$id" : "/playlist/$id"}
						params={{
							id: item.id,
						}}
						className="w-48 h-60 flex-none flex flex-col space-y-2"
					>
						{item.images && item.images.length > 0 ? (
							<img
								src={item.images[0].url}
								alt={`${item.name} cover`}
								className="w-full rounded-2xl"
								style={{
									viewTransitionName: `key-${item.id}`,
								}}
							/>
						) : null}
						<div className="w-full flex-1 flex flex-col">
							<span className="text-sm line-clamp-1">{item.name}</span>
							{item.type === "album" ? (
								<span className="text-sm text-neutral-400">
									{item.artists[0].name}
								</span>
							) : null}
						</div>
					</Link>
				))}
			</div>
		</section>
	);
}
