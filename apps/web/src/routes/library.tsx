import {
	SignedIn,
	SignedOut,
	SignInButton,
	useClerk,
	useUser,
} from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlbumRows } from "../components/album-rows";
import { client } from "../lib/hono-rpc";
import cn from "../utils/cn";

export const Route = createFileRoute("/library")({
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = useClerk();
	const { data: playlists } = useQuery({
		queryKey: ["playlists"],
		queryFn: async () => {
			const res = await client.playlists.$get(
				{},
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error("Could not fetch playlists");
			}

			const json = await res.json();

			return json;
		},
	});
	const { data: albums } = useQuery({
		queryKey: ["albums"],
		queryFn: async () => {
			const res = await client.albums.$get(
				{},
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error("Could not fetch albums");
			}

			const json = await res.json();

			return json;
		},
	});

	return (
		<div className="flex flex-col overflow-hidden">
			<div className="h-16 flex items-center">
				<header
					className={cn(
						"w-full h-16",
						"fixed top-0 left-1/2 -translate-x-1/2",
						"z-10 backdrop-blur-md bg-neutral-900/70",
					)}
				>
					<div className="w-full h-16 px-4 max-w-lg mx-auto flex items-center">
						<h1 className="mb-1 text-2xl font-bold">Your library</h1>
					</div>
				</header>
			</div>
			{playlists?.items ? (
				<AlbumRows
					title="Playlists"
					albumOrPlaylists={playlists?.items.map((p) => ({
						...p,
						type: "playlist",
					}))}
				/>
			) : null}
			{albums?.items ? (
				<AlbumRows
					title="Albums"
					albumOrPlaylists={albums?.items.map((p) => ({
						...p.album,
						type: "album",
					}))}
				/>
			) : null}
		</div>
	);
}
