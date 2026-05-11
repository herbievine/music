import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Cloudflare Workers stores secrets in `.dev.vars` (dotenv-shaped).
// Bun doesn't auto-load that file, so we mirror it into process.env before
// any test runs. Configured via bunfig.toml `[test] preload`.
const envPath = join(import.meta.dir, "..", ".dev.vars");

if (!existsSync(envPath)) {
	throw new Error(
		`[test setup] missing ${envPath} — copy the production secrets locally before running tests.`,
	);
}

const content = readFileSync(envPath, "utf-8");
for (const rawLine of content.split("\n")) {
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
