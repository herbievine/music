import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Cloudflare Workers stores secrets in `.dev.vars` (dotenv-shaped); test-only
// keys (e.g. YOUTUBE_API_KEYS rotation pool) live in `.env.test`. Bun doesn't
// auto-load either. Mirrored into process.env via bunfig.toml `[test] preload`.
function loadDotenv(filename: string, required: boolean): void {
	const path = join(import.meta.dir, "..", filename);

	if (!existsSync(path)) {
		if (required) {
			throw new Error(
				`[test setup] missing ${path} — copy the production secrets locally before running tests.`,
			);
		}
		return;
	}

	for (const rawLine of readFileSync(path, "utf-8").split("\n")) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#") || line.startsWith("//")) continue;

		const eq = line.indexOf("=");
		if (eq === -1) continue;

		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
}

loadDotenv(".dev.vars", true);
loadDotenv(".env.test", false);
