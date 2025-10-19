import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { HomeIcon, LibraryBigIcon, SearchIcon, UserIcon } from "lucide-react";
import { NuqsAdapter } from "nuqs/adapters/react";
import { useState } from "react";
import { Player } from "../components/player/player";
import { useQueueStore } from "../store/queue";
import cn from "../utils/cn";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const [queryClient] = useState(() => new QueryClient());
	const store = useQueueStore();

	return (
		<QueryClientProvider client={queryClient}>
			<NuqsAdapter>
				<SignedIn>
					<div className="h-screen flex flex-col">
						<main className="flex-1 h-[calc(100vh_-_16rem)] w-full max-w-lg mx-auto flex flex-col relative">
							<div
								className={cn(
									"py-2 overfow-auto",
									store.isPlaying ? "pb-36" : "pb-24",
								)}
							>
								<Outlet />
							</div>
							<Player />
						</main>
						<div className="w-full h-16">
							<nav className="w-full max-w-lg mx-auto h-16 flex justify-center items-center border-t border-neutral-700 bg-neutral-900 fixed bottom-0 left-1/2 -translate-x-1/2">
								<ul className="w-full flex justify-evenly items-center space-x-6">
									<li>
										<Link to="/">
											<HomeIcon />
										</Link>
									</li>
									<li>
										<Link to="/search">
											<SearchIcon />
										</Link>
									</li>
									<li>
										<Link to="/library">
											<LibraryBigIcon />
										</Link>
									</li>
									<li>
										<Link to="/login">
											<UserIcon />
										</Link>
									</li>
								</ul>
							</nav>
						</div>
					</div>
				</SignedIn>
				<SignedOut>
					<main className="w-full h-screen flex justify-center items-center">
						<SignInButton />
					</main>
				</SignedOut>
			</NuqsAdapter>
		</QueryClientProvider>
	);
}
