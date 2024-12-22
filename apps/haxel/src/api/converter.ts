import { z } from "zod";
import { fetcher } from "../utils/fetcher";

const apiSchema = z.object({
  link: z.string().nullable().optional(),
  // title: z.string(),
  // progess: z.number().nullish(),
  // duration: z.number(),
  status: z.enum(["ok", "processing", "fail"]),
  msg: z.string().optional(),
});

export async function converter(videoId: string, key: string, retryCount = 0) {
  const searchParams = new URLSearchParams();

  searchParams.append("id", videoId);

  const data = await fetcher(
    `https://youtube-mp36.p.rapidapi.com/dl?${searchParams}`,
    apiSchema,
    {
      headers: {
        "X-RapidAPI-Host": "youtube-mp36.p.rapidapi.com",
        "X-RapidAPI-Key": key,
      },
    },
  );

  if (data.status === "ok" && data.link) {
    console.log(`Link received for ${videoId}: ${data.link}`);

    return data.link;
  }

  if (data.status === "processing" && retryCount <= 10) {
    console.log(
      `Retry: ${retryCount}\nReason: ${data.msg || "Unknown reason"}\nRetrying in ${retryCount * 10} seconds`,
    );

    await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount * 10));

    return converter(videoId, key, retryCount + 1);
  }

  throw `Could not get link: ${data.msg || "Unknown reason"}`;
}
