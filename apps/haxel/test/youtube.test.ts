import { describe, expect, test } from "bun:test";
import { youtube } from "../src/api/youtube";
import { artistMatches, coreTitle, normalize } from "../src/utils/match";
import albumsFixture from "./fixtures/albums.json";

// Integration test against the real YouTube Data API. ~100u quota per track
// (search + videos.list). Full suite ≈ 6100u; Papooz alone ≈ 900u. Do NOT run in CI.

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(
			`${name} is required — should be loaded from .dev.vars via test/setup.ts.`,
		);
	}
	return value;
}

const YOUTUBE_API_KEY = requireEnv("YOUTUBE_API_KEY");

type Track = {
	id: string;
	name: string;
	artists: string[];
	durationMs: number;
};

type Album = {
	albumId: string;
	album: string;
	albumArtists: string[];
	tracks: Track[];
};

const albums = albumsFixture as Album[];

function parseIsoDuration(iso: string): number {
	const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return 0;
	return (
		Number.parseInt(match[1] ?? "0", 10) * 3600 +
		Number.parseInt(match[2] ?? "0", 10) * 60 +
		Number.parseInt(match[3] ?? "0", 10)
	);
}

async function fetchVideoDuration(videoId: string): Promise<number | null> {
	const params = new URLSearchParams({
		part: "contentDetails",
		id: videoId,
		key: YOUTUBE_API_KEY,
	});
	const res = await fetch(
		`https://youtube.googleapis.com/youtube/v3/videos?${params}`,
	);
	if (!res.ok) return null;
	const json = (await res.json()) as {
		items?: { contentDetails?: { duration?: string } }[];
	};
	const iso = json.items?.[0]?.contentDetails?.duration;
	return iso ? parseIsoDuration(iso) : null;
}

for (const album of albums) {
	const popularityHint = album.albumArtists.join(", ");
	describe(`${album.album} — ${popularityHint}`, () => {
		for (const track of album.tracks) {
			const expectedDurationSec = Math.round(track.durationMs / 1000);
			const artist = track.artists[0];

			test(`"${track.name}" returns a video that matches the artist`, async () => {
				const {
					items: [video],
				} = await youtube(
					{
						artist,
						title: track.name,
						durationSeconds: expectedDurationSec,
					},
					YOUTUBE_API_KEY,
				);

				expect(
					video,
					`no YouTube results for "${artist} ${track.name} audio"`,
				).toBeDefined();

				const videoUrl = `https://youtu.be/${video.id.videoId}`;
				const actualDuration = await fetchVideoDuration(video.id.videoId);
				const durationDelta =
					actualDuration !== null
						? Math.abs(actualDuration - expectedDurationSec)
						: null;

				const annotation = [
					"",
					`  expected: "${track.name}" by ${track.artists.join(", ")} (${expectedDurationSec}s)`,
					`  got:      "${video.snippet.title}" by ${video.snippet.channelTitle}`,
					`  url:      ${videoUrl}`,
					`  duration: ${actualDuration ?? "?"}s (Δ ${durationDelta ?? "?"}s)`,
				].join("\n");

				expect(
					artistMatches(
						artist,
						video.snippet.title,
						video.snippet.channelTitle,
					),
					`artist "${artist}" missing from video title and channel.${annotation}`,
				).toBe(true);

				const trackCoreN = normalize(coreTitle(track.name));
				if (trackCoreN.length >= 3) {
					expect(
						normalize(video.snippet.title).includes(trackCoreN),
						`track name "${track.name}" missing from video title.${annotation}`,
					).toBe(true);
				}

				if (durationDelta !== null) {
					expect(
						durationDelta,
						`duration off by ${durationDelta}s, likely wrong video.${annotation}`,
					).toBeLessThanOrEqual(60);
				}
			});
		}
	});
}
