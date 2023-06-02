export default async function fetcher<T>(
  url: string,
  schema?: Zod.AnyZodObject,
  config?: RequestInit
): Promise<T> {
  return fetch(url, config)
    .then((res) => res.json())
    .then((data) => (schema ? schema.parse(data) : data) as T);
}
