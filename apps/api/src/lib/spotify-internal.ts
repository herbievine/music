import crypto from "node:crypto";
import type { MusicImage, MusicPlaylist, MusicPlaylistSummary, MusicTrack } from "../types.js";

/**
 * Reverse-engineered client for Spotify's internal "pathfinder" GraphQL gateway
 * (api-partner.spotify.com) — the same one open.spotify.com uses.
 *
 * Why this exists: the official Web API returns 404 for Spotify-owned editorial
 * and algorithmic playlists (Daily Mix, Discover Weekly, editorial mixes) under
 * this app's access level. The web player resolves them through `fetchPlaylist`,
 * which works for every playlist type. By default we mint an anonymous web
 * token (enough for editorial + public playlists); set SPOTIFY_SP_DC to a
 * service account's cookie to get an account-bound token for personalized content.
 *
 * Not officially supported and against Spotify's ToS — use only behind your own
 * session, never as a public surface. Two constants rotate with the web-player
 * build and will eventually need refreshing (override via env, no redeploy):
 *   - FETCH_PLAYLIST_HASH (the persisted-query hash)
 *   - DEFAULT_TOTP_SECRET / DEFAULT_TOTP_VER (the token-mint TOTP secret)
 */

// Persisted-query hash for the `fetchPlaylist` operation. Captured from the live
// web player (build 1.2.93). Refresh by sniffing a playlist load if it 400s.
const FETCH_PLAYLIST_HASH =
	"a65e12194ed5fc443a1cdebed5fabe33ca5b07b987185d63c72483867ad13cb4";

// Persisted-query hash for the `queryArtistOverview` operation. Captured from the
// live web player. Refresh by sniffing an artist page load if it 400s.
const ARTIST_OVERVIEW_HASH =
	"ae0e2958a4ab645b35ca19ac04d0495ae12d9c5d7b7286217674801a9aab281a";

// TOTP secret for the web-player token mint, version 61 — derived from the
// public web-player bundle (build 1.2.93) and stored as base32 of the key bytes.
// Not account-specific (same for every client); rotates with totpVer. Override
// both via SPOTIFY_TOTP_SECRET / SPOTIFY_TOTP_VER when Spotify bumps the version.
const DEFAULT_TOTP_SECRET =
	"GM3TMMJTGYZTQNZVGM4DINJZHA4TGOBYGMZTCMRTGEYDSMJRHE4TEOBUG4YTCMRUGQ4DQOJUGQYTAMRRGA2TCMJSHE3TCMBY";
const DEFAULT_TOTP_VER = "61";

// Public client id of the Spotify web player (static, not a secret).
const WEB_PLAYER_CLIENT_ID = "d8a5ed958d274c2e8ee717e6a4b0971d";
const WEB_PLAYER_VERSION = "1.2.93.97.g76b53e34";
const UA =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

export class PlaylistNotFoundError extends Error {
	constructor(id: string) {
		super(`Playlist not found: ${id}`);
		this.name = "PlaylistNotFoundError";
	}
}

// --- TOTP (RFC 6238) ---------------------------------------------------------
// Spotify's /api/token requires a time-based code. We compute a standard
// HMAC-SHA1 TOTP over the base32 secret the web player uses (SPOTIFY_TOTP_SECRET).
// Capturing the *derived* secret directly sidesteps Spotify's obfuscated
// byte-transform, so this stays correct until Spotify rotates the secret.

function base32Decode(input: string): Buffer {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	let bits = 0;
	let value = 0;
	const out: number[] = [];
	for (const ch of input.replace(/=+$/, "").toUpperCase()) {
		const idx = alphabet.indexOf(ch);
		if (idx === -1) continue;
		value = (value << 5) | idx;
		bits += 5;
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 0xff);
			bits -= 8;
		}
	}
	return Buffer.from(out);
}

function totp(secretBase32: string, timeSec: number, period = 30, digits = 6): string {
	const counter = BigInt(Math.floor(timeSec / period));
	const buf = Buffer.alloc(8);
	buf.writeBigUInt64BE(counter);
	const hmac = crypto
		.createHmac("sha1", new Uint8Array(base32Decode(secretBase32)))
		.update(new Uint8Array(buf))
		.digest();
	const offset = hmac[hmac.length - 1] & 0x0f;
	const code =
		((hmac[offset] & 0x7f) << 24) |
		((hmac[offset + 1] & 0xff) << 16) |
		((hmac[offset + 2] & 0xff) << 8) |
		(hmac[offset + 3] & 0xff);
	return (code % 10 ** digits).toString().padStart(digits, "0");
}

// --- Token minting (cached in-memory) ----------------------------------------

type CachedToken = { token: string; expiresAt: number };
let accessCache: CachedToken | null = null;
let clientTokenCache: CachedToken | null = null;

async function getClientToken(): Promise<string> {
	if (clientTokenCache && clientTokenCache.expiresAt > Date.now()) {
		return clientTokenCache.token;
	}
	const res = await fetch("https://clienttoken.spotify.com/v1/clienttoken", {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify({
			client_data: {
				client_version: WEB_PLAYER_VERSION,
				client_id: WEB_PLAYER_CLIENT_ID,
				js_sdk_data: {
					device_brand: "unknown",
					device_model: "unknown",
					os: "linux",
					os_version: "unknown",
					device_id: crypto.randomUUID().replace(/-/g, ""),
					device_type: "computer",
				},
			},
		}),
	});
	if (!res.ok) {
		throw new Error(`clienttoken failed: ${res.status} ${await res.text()}`);
	}
	const data = (await res.json()) as {
		granted_token?: { token: string; refresh_after_seconds: number };
	};
	const granted = data.granted_token;
	if (!granted?.token) {
		throw new Error("clienttoken: no granted_token in response");
	}
	clientTokenCache = {
		token: granted.token,
		expiresAt: Date.now() + (granted.refresh_after_seconds - 60) * 1000,
	};
	return granted.token;
}

async function getAccessToken(): Promise<string> {
	if (accessCache && accessCache.expiresAt > Date.now()) {
		return accessCache.token;
	}
	// Use `||` not `??`: deploys (e.g. docker compose `KEY: ${VAR}`) inject these
	// as empty strings when unset, and an empty secret/ver mints a bad TOTP that
	// the token endpoint rejects with a 400. Treat empty as unset.
	const secret = process.env.SPOTIFY_TOTP_SECRET || DEFAULT_TOTP_SECRET;
	const code = totp(secret, Math.floor(Date.now() / 1000));
	const url = new URL("https://open.spotify.com/api/token");
	url.searchParams.set("reason", "init");
	url.searchParams.set("productType", "web-player");
	url.searchParams.set("totp", code);
	url.searchParams.set("totpServer", code);
	url.searchParams.set("totpVer", process.env.SPOTIFY_TOTP_VER || DEFAULT_TOTP_VER);

	// sp_dc is optional: without it the token is anonymous (enough for editorial
	// and other public playlists); with the service account's cookie the token is
	// account-bound (needed only for that account's personalized content).
	const headers: Record<string, string> = { "User-Agent": UA, Accept: "application/json" };
	const spDc = process.env.SPOTIFY_SP_DC;
	if (spDc) headers.Cookie = `sp_dc=${spDc}`;

	const res = await fetch(url, { headers });
	if (!res.ok) {
		throw new Error(`token mint failed: ${res.status} ${await res.text()}`);
	}
	const data = (await res.json()) as {
		accessToken?: string;
		accessTokenExpirationTimestampMs?: number;
		isAnonymous?: boolean;
	};
	if (!data.accessToken) {
		throw new Error("token mint: no accessToken in response (check sp_dc/TOTP)");
	}
	accessCache = {
		token: data.accessToken,
		expiresAt: (data.accessTokenExpirationTimestampMs ?? Date.now() + 3_600_000) - 60_000,
	};
	return data.accessToken;
}

// --- Pathfinder fetch + mapping ----------------------------------------------

function idFromUri(uri?: string): string {
	return uri ? (uri.split(":").pop() ?? "") : "";
}

function mapImages(sources?: { url: string; width?: number; height?: number }[]): MusicImage[] {
	return (sources ?? []).map((s) => ({ url: s.url, width: s.width, height: s.height }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(item: any): MusicTrack | null {
	const t = item?.itemV2?.data;
	if (!t || t.__typename !== "Track") return null;
	const album = t.albumOfTrack ?? {};
	// releaseDate isn't on itemV2's album; itemV3 carries it as firstPublishedAt.
	const releaseDate =
		item?.itemV3?.data?.identityTrait?.contentHierarchyParent?.publishingMetadataTrait
			?.firstPublishedAt?.isoString ?? "";
	return {
		id: idFromUri(t.uri),
		name: t.name ?? "",
		durationMs: t.trackDuration?.totalMilliseconds ?? 0,
		trackNumber: t.trackNumber ?? 0,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		artists: (t.artists?.items ?? []).map((a: any) => ({
			id: idFromUri(a.uri),
			name: a.profile?.name ?? "",
		})),
		type: "track" as const,
		album: {
			id: idFromUri(album.uri),
			name: album.name ?? "",
			images: mapImages(album.coverArt?.sources),
			releaseDate,
		},
	};
}

/**
 * Resolve the Spotify station ("song radio") for a track via the internal
 * inspiredby-mix endpoint and return the generated playlist ID.
 */
export async function fetchRadioPlaylistId(trackId: string): Promise<string> {
	const [accessToken, clientToken] = await Promise.all([
		getAccessToken(),
		getClientToken(),
	]);
	const res = await fetch(
		`https://spclient.wg.spotify.com/inspiredby-mix/v2/seed_to_playlist/spotify:track:${trackId}?response-format=json`,
		{
			headers: {
				authorization: `Bearer ${accessToken}`,
				"client-token": clientToken,
				"app-platform": "WebPlayer",
				Accept: "application/json",
				"User-Agent": UA,
			},
		},
	);
	if (!res.ok) {
		throw new Error(`inspiredby-mix failed: ${res.status} ${await res.text()}`);
	}
	const data = (await res.json()) as { mediaItems?: { uri: string }[] };
	const uri = data.mediaItems?.[0]?.uri;
	if (!uri) throw new Error("No radio playlist returned for track");
	return uri.split(":").pop()!;
}

/**
 * Fetch a playlist (any type — editorial, algorithmic, or user-created) via the
 * internal pathfinder API and map it to MusicPlaylist. Throws
 * PlaylistNotFoundError if the playlist doesn't resolve.
 */
export async function fetchInternalPlaylist(
	id: string,
	opts?: { offset?: number; limit?: number },
): Promise<MusicPlaylist> {
	const [accessToken, clientToken] = await Promise.all([
		getAccessToken(),
		getClientToken(),
	]);

	const body = {
		operationName: "fetchPlaylist",
		variables: {
			uri: `spotify:playlist:${id}`,
			offset: opts?.offset ?? 0,
			limit: opts?.limit ?? 100,
			enableWatchFeedEntrypoint: false,
			includeEpisodeContentRatingsV2: false,
		},
		extensions: {
			persistedQuery: { version: 1, sha256Hash: FETCH_PLAYLIST_HASH },
		},
	};

	const res = await fetch("https://api-partner.spotify.com/pathfinder/v2/query", {
		method: "POST",
		headers: {
			authorization: `Bearer ${accessToken}`,
			"client-token": clientToken,
			"Content-Type": "application/json;charset=UTF-8",
			Accept: "application/json",
			"app-platform": "WebPlayer",
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		throw new Error(`pathfinder failed: ${res.status} ${await res.text()}`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const json = (await res.json()) as any;
	const p = json?.data?.playlistV2;
	if (!p || p.__typename === "NotFound") {
		throw new PlaylistNotFoundError(id);
	}

	// NOTE: track-item fields below were verified against live traffic. Playlist-
	// level image nesting (images.items[].sources) follows the standard web-player
	// shape but wasn't re-confirmed on this build — mapped defensively.
	const items = (p?.content?.items ?? [])
		.map(mapItem)
		.filter((t: MusicTrack | null): t is MusicTrack => t !== null);

	return {
		id,
		type: "playlist" as const,
		name: p?.name ?? "",
		description: p?.description ?? "",
		images: mapImages(p?.images?.items?.[0]?.sources),
		tracks: {
			total: p?.content?.totalCount ?? items.length,
			items: items.map((track: MusicTrack) => ({ track })),
		},
	};
}

/**
 * Find an artist's official "This Is <Artist>" playlist via the internal
 * pathfinder API's artist-overview query. Returns null (never throws) if the
 * artist has no such playlist, or if the lookup fails — this is a nice-to-have
 * enhancement, not core artist data, so callers should degrade gracefully.
 */
export async function fetchArtistThisIsPlaylist(
	artistId: string,
): Promise<MusicPlaylistSummary | null> {
	try {
		const [accessToken, clientToken] = await Promise.all([
			getAccessToken(),
			getClientToken(),
		]);

		const body = {
			operationName: "queryArtistOverview",
			variables: { uri: `spotify:artist:${artistId}`, locale: "", preReleaseV2: true },
			extensions: {
				persistedQuery: { version: 1, sha256Hash: ARTIST_OVERVIEW_HASH },
			},
		};

		const res = await fetch("https://api-partner.spotify.com/pathfinder/v2/query", {
			method: "POST",
			headers: {
				authorization: `Bearer ${accessToken}`,
				"client-token": clientToken,
				"Content-Type": "application/json;charset=UTF-8",
				Accept: "application/json",
				"app-platform": "WebPlayer",
			},
			body: JSON.stringify(body),
		});
		if (!res.ok) return null;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const json = (await res.json()) as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const items = json?.data?.artistUnion?.relatedContent?.featuringV2?.items ?? [];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const match = items.find((item: any) => {
			const d = item?.data;
			return (
				d?.__typename === "Playlist" &&
				d?.ownerV2?.data?.name === "Spotify" &&
				typeof d?.name === "string" &&
				d.name.toLowerCase().startsWith("this is ")
			);
		})?.data;

		if (!match) return null;

		return {
			id: match.id,
			type: "playlist" as const,
			name: match.name ?? "",
			description: match.description ?? "",
			images: mapImages(match.images?.items?.[0]?.sources),
		};
	} catch {
		return null;
	}
}
