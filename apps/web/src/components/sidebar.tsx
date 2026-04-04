import { UserButton } from "@clerk/clerk-react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { Home, Search, Disc3, ListMusic } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
	{ to: "/", icon: Home, label: "Home" },
	{ to: "/search", icon: Search, label: "Search" },
	{ to: "/discography", icon: Disc3, label: "Discography" },
	{ to: "/playlists", icon: ListMusic, label: "Playlists" },
] as const;

export default function AppSidebar() {
	const matchRoute = useMatchRoute();

	return (
		<Sidebar variant="floating" collapsible="none">
			<SidebarHeader>
				<div className="px-2 py-1">
					<span className="text-sidebar-foreground font-semibold text-base flex items-center gap-2">
					  Music 🤙
					</span>
				</div>
			</SidebarHeader>

			<SidebarSeparator />

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map(({ to, icon: Icon, label }) => {
								const isActive = !!matchRoute({ to, fuzzy: to === "/" ? false : true });
								return (
									<SidebarMenuItem key={to}>
										<SidebarMenuButton asChild isActive={isActive} tooltip={label}>
											<Link to={to}>
												<Icon />
												<span>{label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarSeparator />

			<SidebarFooter>
				<div className="flex items-center gap-3 px-2 py-1">
					<UserButton />
					<span className="text-xs text-sidebar-foreground/50">Account</span>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
