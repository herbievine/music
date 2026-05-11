const NAMED_ENTITIES: Record<string, string> = {
	"&amp;": "&",
	"&#39;": "'",
	"&apos;": "'",
	"&quot;": '"',
	"&lt;": "<",
	"&gt;": ">",
	"&nbsp;": " ",
};

export function decodeHtmlEntities(input: string): string {
	return input
		.replace(/&(amp|#39|apos|quot|lt|gt|nbsp);/g, (m) => NAMED_ENTITIES[m] ?? m)
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function normalize(input: string): string {
	return decodeHtmlEntities(input)
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]/g, "");
}

export function coreTitle(title: string): string {
	return title
		.replace(/\s*[-–]\s*.*$/g, "")
		.replace(/\s*\([^)]*\)\s*/g, " ")
		.replace(/\s*\[[^\]]*\]\s*/g, " ");
}

export function artistWords(artist: string): string[] {
	return decodeHtmlEntities(artist)
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.split(/[^a-z0-9]+/)
		.filter((w) => w.length >= 4);
}

export function artistMatches(artist: string, ...haystacks: string[]): boolean {
	const words = artistWords(artist);
	const normalized = haystacks.map(normalize);

	if (words.length === 0) {
		const compact = normalize(artist);
		return normalized.some((h) => h.includes(compact));
	}

	return words.some((word) => normalized.some((h) => h.includes(word)));
}
