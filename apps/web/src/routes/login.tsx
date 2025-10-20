import {
	SignedIn,
	SignedOut,
	SignInButton,
	UserProfile,
} from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="">
			<SignedOut>
				<SignInButton />
			</SignedOut>
			<SignedIn>
				<UserProfile />
			</SignedIn>
			<span>{import.meta.env.COMMIT_HASH}</span>
		</div>
	);
}
