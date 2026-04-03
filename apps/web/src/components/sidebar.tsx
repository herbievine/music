import { UserButton } from "@clerk/clerk-react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { Home, Library, Music2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const navItems = [
	{ to: "/", icon: Home, label: "Home" },
	{ to: "/search", icon: Search, label: "Search" },
	{ to: "/library", icon: Library, label: "Library" },
] as const;

export default function Sidebar() {
	const matchRoute = useMatchRoute();

	return (
		<div className="flex flex-col w-56 h-full rounded-xl bg-card flex-shrink-0 overflow-hidden">
			{/* Logo */}
			<div className="px-5 py-5">
				<span className="text-foreground font-semibold text-base flex items-center gap-2">
					<Music2 className="w-4 h-4 text-muted-foreground" />
					music
				</span>
			</div>

			<Separator />

			{/* Nav */}
			<nav className="flex-1 flex flex-col gap-0.5 px-2 py-3">
				{navItems.map(({ to, icon: Icon, label }) => {
					const isActive = !!matchRoute({ to, fuzzy: to === "/" ? false : true });
					return (
						<Tooltip key={to}>
							<TooltipTrigger asChild>
								<Link
									to={to}
									className={cn(
										"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
										isActive
											? "bg-secondary text-foreground"
											: "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
									)}
								>
									<Icon className="w-4 h-4 flex-shrink-0" />
									{label}
								</Link>
							</TooltipTrigger>
							<TooltipContent side="right">{label}</TooltipContent>
						</Tooltip>
					);
				})}
			</nav>

			<Separator />

			{/* Bottom: user */}
			<div className="px-4 py-4 flex items-center gap-3">
				<UserButton />
				<span className="text-xs text-muted-foreground">Account</span>
			</div>
		</div>
	);
}
