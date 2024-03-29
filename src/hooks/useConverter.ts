import * as z from "zod";
import fetcher from "@/lib/fetcher";
import { YoutubeApiSchema } from "@/schemas/youtube";
import { MediaSong } from "@/types/media";

const buildYoutubeUrl = (query: string) => {
  const baseUrl = "https://youtube.googleapis.com/youtube/v3/search";
  const urlParams = new URLSearchParams({
    part: "snippet",
    maxResults: "5",
    q: query,
    type: "video",
    key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ?? "",
  });
  return `${baseUrl}?${urlParams}`;
};

const buildConverterUrl = (videoId: string) => {
  const baseUrl = "https://youtube-mp36.p.rapidapi.com/dl";
  const urlParams = new URLSearchParams({
    id: videoId,
  });
  return `${baseUrl}?${urlParams}`;
};

const ConverterApiSchema = z.object({
  link: z.string(),
  title: z.string(),
  progess: z.number().nullish(),
  duration: z.number(),
  status: z.string(),
  msg: z.string(),
});

export default function useConverter() {
  async function convert(song: MediaSong) {
    try {
      const data = await fetcher(
        buildYoutubeUrl(`${song.title} ${song.artist} audio`),
        YoutubeApiSchema
      );

      if (!data) {
        return null;
      }

      const videoId = data.items[0].id.videoId;

      const converterData = await fetcher(
        buildConverterUrl(videoId),
        ConverterApiSchema,
        {
          headers: {
            "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPID_KEY ?? "",
            "X-RapidAPI-Host": process.env.NEXT_PUBLIC_RAPID_HOST ?? "",
          },
        }
      );

      return converterData?.link ?? null;
    } finally {
    }
  }

  return {
    convert,
  };
}

export { useConverter };
