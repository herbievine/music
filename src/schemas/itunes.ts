import { z } from "zod";

export function getItunesApiSchema<T extends z.AnyZodObject>(resultType: T) {
  return z.object({
    resultCount: z.number(),
    results: z.array(resultType),
  });
}
