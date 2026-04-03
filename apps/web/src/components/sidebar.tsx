import { UserButton } from "@clerk/clerk-react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { Home, Library, Music2, Search } from "lucide-react";
import cn from "../utils/cn";

const navItems = [
	{ to: "/", icon: Home, label: "Home" },
	{ to: "/search", icon: Search, label: "Search" },
	{ to: "/library", icon: Library, label: "Library" },
] as const;

export default function Sidebar() {
	const matchRoute = useMatchRoute();

	return (
		<div className="flex flex-col w-60 h-full bg-zinc-900 border-r border-zinc-800 flex-shrink-0">
			{/* Logo */}
			<div className="px-6 py-6">
				<span className="text-white font-bold text-lg flex items-center gap-2">
					<Music2 className="w-5 h-5" />
					◈ music
				</span>
			</div>

			{/* Nav */}
			<nav className="flex-1 flex flex-col gap-1">
				{navItems.map(({ to, icon: Icon, label }) => {
					const isActive = !!matchRoute({ to, fuzzy: to === "/" ? false : true });
					return (
						<Link
							key={to}
							to={to}
							className={cn(
								"flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 text-sm font-medium transition-colors",
								isActive
									? "bg-zinc-800 text-white"
									: "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
							)}
						>
							<Icon className="w-4 h-4" />
							{label}
						</Link>
					);
				})}
			</nav>

			{/* Bottom: user */}
			<div className="px-4 py-4">
				<UserButton />
			</div>
		</div>
	);
}
