import type { z } from "zod";

export async function fetcher<S extends z.ZodTypeAny>(
	url: string,
	schema: S,
	options?: RequestInit,
): Promise<z.output<S>> {
	return fetch(url, {
		headers: {
			"Content-Type": "application/json",
		},
		...options,
	}).then(async (res) => {
		if (res.status === 204) {
			return;
		}

		if (!res.ok) {
			const body = await res.text();
			console.error(
				`[FETCH ERROR]\nCode from API: ${res.status}\nResponse from API: ${body}`,
			);

			throw new Error(`fetcher: ${res.status} ${res.statusText || ""}`.trim());
		}

		const json = await res.json();

		const parsedJson = schema.safeParse(json);

		if (parsedJson.success === false) {
			console.error(
				`An error occurred validating '${url}'\n${JSON.stringify(json)}\n${parsedJson.error}`,
			);

			throw new Error("An error occurred");
		}

		return parsedJson.data as z.output<S>;
	});
}
