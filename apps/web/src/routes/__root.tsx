import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { HomeIcon, LibraryBigIcon, SearchIcon, UserIcon } from "lucide-react";
import { NuqsAdapter } from "nuqs/adapters/react";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import QueuePanel from "../components/queue-panel";
import { PlayerBar } from "../components/player/player-bar";
import { Player } from "../components/player/player";
import Sidebar from "../components/sidebar";
import { AudioProvider } from "../contexts/audio-context";
import { useQueueStore } from "../store/queue";
import { cn } from "@/lib/utils";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const [queryClient] = useState(() => new QueryClient());
	const store = useQueueStore();

	return (
		<QueryClientProvider client={queryClient}>
			<NuqsAdapter>
				<TooltipProvider>
					<SignedIn>
						<AudioProvider>
						{/* ── MOBILE ── */}
						<div className="lg:hidden h-screen flex flex-col">
							<main className="flex-1 h-[calc(100vh_-_16rem)] w-full max-w-lg mx-auto flex flex-col relative">
								<div
									className={cn(
										"px-4 py-2 overflow-auto",
										store.isPlaying ? "pb-36" : "pb-24",
									)}
								>
									<Outlet />
								</div>
								<Player />
							</main>
							<div className="w-full h-16">
								<nav className="w-full max-w-lg mx-auto h-16 flex justify-center items-center border-t border-border bg-background fixed bottom-0 left-1/2 -translate-x-1/2">
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

						{/* ── DESKTOP ── */}
						<div className="hidden lg:flex h-screen overflow-hidden flex-col bg-background">
							<div className="flex flex-1 overflow-hidden gap-2 p-2 pb-0">
								{/* Left sidebar */}
								<Sidebar />

								{/* Main content */}
								<main className="flex-1 overflow-y-auto rounded-xl bg-card px-8 py-6 pb-28 min-w-0">
									<Outlet />
								</main>

								{/* Right queue panel */}
								<QueuePanel />
							</div>

							{/* Desktop player bar */}
							<PlayerBar />
						</div>
						</AudioProvider>
					</SignedIn>

					<SignedOut>
						<main className="w-full h-screen flex justify-center items-center">
							<SignInButton />
						</main>
					</SignedOut>
				</TooltipProvider>
			</NuqsAdapter>
		</QueryClientProvider>
	);
}
