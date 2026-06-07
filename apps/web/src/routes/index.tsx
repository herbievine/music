import { UserButton, useClerk, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { HomeSection } from "../components/home-section";
import { client } from "../lib/hono-rpc";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const { session } = useClerk();
	const { user } = useUser();

	const { data: home } = useQuery({
		queryKey: ["home"],
		queryFn: async () => {
			const res = await client.home.$get(
				{},
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);
			if (!res.ok) throw new Error("Could not fetch home");
			return res.json();
		},
	});

	return (
		<div className="flex flex-col gap-6 px-4 sm:px-8 py-2 sm:py-6">
			{/* Mobile header */}
			<div className="lg:hidden h-16 flex items-center">
				<header className="w-full h-16 fixed top-0 left-1/2 -translate-x-1/2 z-10 backdrop-blur-md bg-background/70">
					<div className="w-full h-16 px-4 max-w-lg mx-auto flex items-center justify-between">
						<h1 className="text-2xl font-bold">Hi {user?.firstName} :)</h1>
						<UserButton />
					</div>
				</header>
			</div>

			{/* Desktop header */}
			<div className="hidden lg:block">
				<h1 className="text-2xl font-bold">
					Good{getTimeOfDay()}, {user?.firstName}
				</h1>
			</div>

			{home?.sections.map((section) => (
				<HomeSection key={section.id} section={section} />
			))}
		</div>
	);
}

function getTimeOfDay() {
	const h = new Date().getHours();
	if (h < 12) return " morning";
	if (h < 17) return " afternoon";
	return " evening";
}
