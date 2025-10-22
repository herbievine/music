import type { Album, Playlist } from "@music/api";
import { Link } from "@tanstack/react-router";

type Props = {
	title: string;
	albumOrPlaylists:
		| (Album & { type: "album" })[]
		| (Playlist & { type: "playlist" })[];
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
				{albumOrPlaylists.map((albumOrPlaylist) => (
					<Link
						key={albumOrPlaylist.id}
						to={
							albumOrPlaylist.type === "album" ? "/album/$id" : "/playlist/$id"
						}
						params={{
							id: albumOrPlaylist.id,
						}}
						className="w-48 h-60 flex-none flex flex-col space-y-2"
					>
						{albumOrPlaylist.images && albumOrPlaylist.images.length > 0 ? (
							<img
								src={albumOrPlaylist.images[0].url}
								alt={`${albumOrPlaylist.name} cover`}
								className="w-full rounded-2xl"
								style={{
									viewTransitionName: `key-${albumOrPlaylist.id}`,
								}}
							/>
						) : null}
						<div className="w-full flex-1 flex flex-col">
							<span className="text-sm line-clamp-1">
								{albumOrPlaylist.name}
							</span>
							{albumOrPlaylist.type === "album" ? (
								<span className="text-sm text-neutral-400">
									{albumOrPlaylist.artists[0].name}
								</span>
							) : null}
						</div>
					</Link>
				))}
			</div>
		</section>
	);
}
