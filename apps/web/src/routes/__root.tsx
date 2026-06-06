import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Disc3, HomeIcon, ListMusic, SearchIcon } from "lucide-react";
import { NuqsAdapter } from "nuqs/adapters/react";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import QueuePanel from "../components/queue-panel";
import { PlayerBar } from "../components/player/player-bar";
import { Player } from "../components/player/player";
import AppSidebar from "../components/sidebar";
import { AudioProvider } from "../contexts/audio-context";
import { useQueueStore } from "../store/queue";
import { cn } from "@/lib/utils";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const [queryClient] = useState(() => new QueryClient());
	const store = useQueueStore();
	const showQueuePanel = useQueueStore((s) => s.showQueuePanel);

	return (
		<QueryClientProvider client={queryClient}>
			<NuqsAdapter>
				<Toaster
					position="bottom-center"
					toastOptions={{
						style: {
							background: "var(--card)",
							color: "var(--card-foreground)",
							border: "1px solid var(--border)",
							fontSize: "0.875rem",
						},
					}}
				/>
				<TooltipProvider>
					<SignedIn>
						<AudioProvider>
							{/* ── MOBILE ── */}
							<div className="lg:hidden h-screen flex flex-col">
								<main className="flex-1 h-[calc(100vh_-_16rem)] w-full max-w-lg mx-auto flex flex-col relative">
									<div
										className={cn(
											"overflow-auto",
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
												<Link to="/"><HomeIcon /></Link>
											</li>
											<li>
												<Link to="/search"><SearchIcon /></Link>
											</li>
											<li>
												<Link to="/discography"><Disc3 /></Link>
											</li>
											<li>
												<Link to="/playlists"><ListMusic /></Link>
											</li>
										</ul>
									</nav>
								</div>
							</div>

							{/* ── DESKTOP ── */}
							<div className="hidden lg:flex h-screen overflow-hidden flex-col bg-background">
								<SidebarProvider
									className="flex-1 overflow-hidden min-h-0"
									style={{ "--sidebar-width": "220px" } as React.CSSProperties}
								>
									<AppSidebar />

									{/* Main + queue area */}
									<div className="flex flex-1 overflow-hidden gap-2 p-2 pb-0">
										<main className="flex-1 overflow-y-auto overflow-x-hidden rounded-xl bg-card pb-6 min-w-0">
											<Outlet />
										</main>
										{showQueuePanel && <QueuePanel />}
									</div>
								</SidebarProvider>

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
