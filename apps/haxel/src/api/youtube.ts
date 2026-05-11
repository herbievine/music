import { z } from "zod";
import { fetcher } from "../utils/fetcher";
import { artistMatches, coreTitle, normalize } from "../utils/match";

const videoSchema = z.object({
	kind: z.string(),
	etag: z.string(),
	id: z.object({
		kind: z.string(),
		videoId: z.string(),
	}),
	snippet: z.object({
		publishedAt: z.string(),
		channelId: z.string(),
		title: z.string(),
		description: z.string(),
		thumbnails: z.object({
			default: z.object({
				url: z.string(),
				width: z.number(),
				height: z.number(),
			}),
			medium: z.object({
				url: z.string(),
				width: z.number(),
				height: z.number(),
			}),
			high: z.object({
				url: z.string(),
				width: z.number(),
				height: z.number(),
			}),
		}),
		channelTitle: z.string(),
		liveBroadcastContent: z.string(),
		publishTime: z.string(),
	}),
});

const searchApiSchema = z.object({
	kind: z.string(),
	etag: z.string(),
	nextPageToken: z.string().optional(),
	regionCode: z.string().optional(),
	pageInfo: z.object({
		totalResults: z.number(),
		resultsPerPage: z.number(),
	}),
	items: z.array(videoSchema),
});

const videoDetailsSchema = z.object({
	items: z.array(
		z.object({
			id: z.string(),
			contentDetails: z.object({
				duration: z.string(),
			}),
		}),
	),
});

function parseIsoDuration(iso: string): number {
	const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return 0;
	return (
		Number.parseInt(match[1] ?? "0", 10) * 3600 +
		Number.parseInt(match[2] ?? "0", 10) * 60 +
		Number.parseInt(match[3] ?? "0", 10)
	);
}

export interface YoutubeSearchSpec {
	artist: string;
	title: string;
	durationSeconds?: number;
}

/**
 * Picks the best YouTube video for a Spotify track. The previous implementation
 * (single `<artist> <title> audio` query, hard duration cutoff, silent fallback
 * to items[0]) returned the wrong video for ~50% of niche tracks because the YT
 * Data API ranks differently from web search and the duration filter let short
 * teaser clips win.
 *
 * Strategy:
 *   1. Query `"<title>" <artist>` — quoted title forces exact-phrase relevance.
 *   2. Fetch 50 candidates (same 100u cost as 5) + durations in one batched call.
 *   3. Score: +1000 title hit · +500 artist hit · +300 Topic channel · +300 channel
 *      matches artist · linear duration penalty up to 60s, then 10× past that.
 */
export async function youtube(spec: YoutubeSearchSpec, key: string) {
	const query = `"${spec.title}" ${spec.artist}`;

	const searchParams = new URLSearchParams();
	searchParams.append("part", "snippet");
	searchParams.append("q", query);
	searchParams.append("maxResults", "50");
	searchParams.append("type", "video");
	searchParams.append("key", key);

	const { items } = await fetcher(
		`https://youtube.googleapis.com/youtube/v3/search?${searchParams}`,
		searchApiSchema,
	);

	if (items.length === 0) {
		return { items };
	}

	const videoIds = items.map((v) => v.id.videoId).join(",");
	const detailParams = new URLSearchParams();
	detailParams.append("part", "contentDetails");
	detailParams.append("id", videoIds);
	detailParams.append("key", key);

	const { items: details } = await fetcher(
		`https://youtube.googleapis.com/youtube/v3/videos?${detailParams}`,
		videoDetailsSchema,
	);

	const trackCoreN = normalize(coreTitle(spec.title));

	const scored = items.map((video, index) => {
		const detail = details.find((d) => d.id === video.id.videoId);
		const duration = detail
			? parseIsoDuration(detail.contentDetails.duration)
			: null;

		const titleHit =
			trackCoreN.length >= 3 &&
			normalize(video.snippet.title).includes(trackCoreN);
		const artistHit = artistMatches(
			spec.artist,
			video.snippet.title,
			video.snippet.channelTitle,
		);
		const isTopicChannel = /\s-\sTopic$/i.test(video.snippet.channelTitle);
		const channelIsArtist =
			normalize(video.snippet.channelTitle) === normalize(spec.artist);

		let score = 0;
		if (titleHit) score += 1000;
		if (artistHit) score += 500;
		if (isTopicChannel) score += 300;
		if (channelIsArtist) score += 300;

		if (duration !== null && spec.durationSeconds !== undefined) {
			const delta = Math.abs(duration - spec.durationSeconds);
			score -= delta <= 60 ? delta : 60 + (delta - 60) * 10;
		}

		score -= index / 10;

		return { video, score };
	});

	scored.sort((a, b) => b.score - a.score);

	return { items: [scored[0].video] };
}
