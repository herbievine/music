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

const apiSchema = z.object({
  kind: z.string(),
  etag: z.string(),
  nextPageToken: z.string(),
  regionCode: z.string(),
  pageInfo: z.object({
    totalResults: z.number(),
    resultsPerPage: z.number(),
  }),
  items: z.array(videoSchema),
});

export function youtube(query: string, key: string) {
  const searchParams = new URLSearchParams();

  searchParams.append("part", "snippet");
  searchParams.append("q", query);
  searchParams.append("maxResults", "1");
  searchParams.append("type", "video");
  searchParams.append("key", key);

  return fetcher(`https://youtube.googleapis.com/youtube/v3/search?${searchParams}`, apiSchema);
}
