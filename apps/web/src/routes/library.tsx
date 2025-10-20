import {
	SignedIn,
	SignedOut,
	SignInButton,
	useClerk,
	useUser,
} from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { client } from "../lib/hono-rpc";
import cn from "../utils/cn";

export const Route = createFileRoute("/library")({
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = useClerk();
	const { data } = useQuery({
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

	return (
		<div className="flex flex-col overflow-hidden">
			<div className="h-16 flex items-center">
				<header
					className={cn(
						"w-full h-16",
						"fixed top-0 left-1/2 -translate-x-1/2",
						"z-10 backdrop-blur-md bg-neutral-900/10",
					)}
				>
					<div className="w-full h-16 px-4 max-w-lg mx-auto flex items-center">
						<h1 className="mb-1 text-2xl font-bold">Your library</h1>
					</div>
				</header>
			</div>
			<div
				className="grid grid-cols-2 gap-6 px-4"
				style={{
					scrollbarWidth: "none",
				}}
			>
				{data?.items.map((result) => (
					<Link
						key={result.id}
						to="/playlist/$id"
						params={{
							id: result.id,
						}}
						className="flex flex-col items-start space-y-2"
					>
						{result.images && result.images.length > 0 ? (
							<img
								src={result.images[0].url}
								alt={`${result.name} cover`}
								className="w-full rounded-2xl"
								style={{
									viewTransitionName: `key-${result.id}`,
								}}
							/>
						) : null}
						<div className="flex flex-col space-y-1">
							<span className="text-sm font-bold line-clamp-2">
								{result.name}
							</span>
							<span className="text-sm font-bold text-zinc-500">
								{result.description}
							</span>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
