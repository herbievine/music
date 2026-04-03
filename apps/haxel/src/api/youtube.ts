import { z } from "zod";
import { fetcher } from "../utils/fetcher";

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
    parseInt(match[1] ?? "0") * 3600 +
    parseInt(match[2] ?? "0") * 60 +
    parseInt(match[3] ?? "0")
  );
}

export async function youtube(
  query: string,
  key: string,
  durationSeconds?: number,
) {
  const searchParams = new URLSearchParams();
  searchParams.append("part", "snippet");
  searchParams.append("q", query);
  searchParams.append("maxResults", durationSeconds != null ? "5" : "1");
  searchParams.append("type", "video");
  searchParams.append("key", key);

  const { items } = await fetcher(
    `https://youtube.googleapis.com/youtube/v3/search?${searchParams}`,
    searchApiSchema,
  );

  if (durationSeconds == null || items.length === 0) {
    return { items };
  }

  // Fetch actual durations for all candidate results
  const videoIds = items.map((v) => v.id.videoId).join(",");
  const detailParams = new URLSearchParams();
  detailParams.append("part", "contentDetails");
  detailParams.append("id", videoIds);
  detailParams.append("key", key);

  const { items: details } = await fetcher(
    `https://youtube.googleapis.com/youtube/v3/videos?${detailParams}`,
    videoDetailsSchema,
  );

  const maxAllowed = durationSeconds + 5;

  // Pick the first result whose duration is within the allowed window
  const best = items.find((video) => {
    const detail = details.find((d) => d.id === video.id.videoId);
    if (!detail) return false;
    return parseIsoDuration(detail.contentDetails.duration) <= maxAllowed;
  });

  // Fall back to the first result if nothing fits
  return { items: [best ?? items[0]] };
}
