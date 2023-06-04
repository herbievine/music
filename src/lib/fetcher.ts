import { z } from "zod";

export default async function fetcher<T extends z.AnyZodObject>(
  url: string,
  schema: T,
  config?: RequestInit
): Promise<z.infer<T> | null> {
  return fetch(url, config)
    .then((res) => res.json())
    .then((data) => {
      if (!schema.safeParse(data).success) return null;
      return schema.parse(data);
    });
}
