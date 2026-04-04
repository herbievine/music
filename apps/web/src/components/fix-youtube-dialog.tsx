import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/hono-rpc";
import { useClerk } from "@clerk/clerk-react";

function extractYoutubeVideoId(url: string): string | null {
	try {
		// Handle youtube.com/watch?v=ID
		const match1 = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
		if (match1) return match1[1];

		// Handle just the ID
		const match2 = url.match(/^[a-zA-Z0-9_-]{11}$/);
		if (match2) return match2[0];

		return null;
	} catch {
		return null;
	}
}

export function FixYoutubeDialog({
	open,
	onOpenChange,
	spotifyId,
	songName,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	spotifyId: string;
	songName: string;
}) {
	const [url, setUrl] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const { session } = useClerk();

	async function handleSubmit() {
		const videoId = extractYoutubeVideoId(url);
		if (!videoId) {
			setError("Invalid YouTube URL or video ID");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Fetch audio with the provided YouTube video ID
			const res = await client.play[":spotifyId"].$get(
				{
					param: { spotifyId },
					query: { youtubeVideoId: videoId },
				},
				{
					headers: {
						Authorization: `Bearer ${await session?.getToken()}`,
					},
				},
			);

			if (!res.ok) {
				throw new Error("Failed to fix YouTube URL");
			}

			// Invalidate the play query so it re-fetches
			queryClient.invalidateQueries({ queryKey: ["play"] });

			setUrl("");
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Fix YouTube URL</DialogTitle>
					<DialogDescription>
						The wrong song is playing for "{songName}". Paste the correct YouTube URL below.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						placeholder="https://www.youtube.com/watch?v=..."
						value={url}
						onChange={(e) => {
							setUrl(e.target.value);
							setError(null);
						}}
						disabled={isLoading}
					/>
					{error && <p className="text-xs text-red-500">{error}</p>}
					<p className="text-xs text-muted-foreground">
						You can also paste just the video ID (11 characters)
					</p>
				</div>

				<div className="flex justify-end gap-2 mt-6">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isLoading || !url.trim()}
					>
						{isLoading ? "Fixing..." : "Fix"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
