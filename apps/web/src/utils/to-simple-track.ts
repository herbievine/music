import type { Track, TrackSimplified } from "@music/api";
import type { SimpleTrack } from "../store/queue";

export function toSimpleTrack(
	track: TrackSimplified | Track,
	album: {
		id: string;
		name?: string | undefined;
		images: { url: string }[];
	},
): SimpleTrack {
	return {
		id: track.id,
		name: track.name,
		durationMs: track.duration_ms,
		artists: track.artists.map(({ id, name }) => ({ id, name })),
		album: {
			id: album.id,
			name: album.name ?? "",
			image: album.images[0].url ?? "",
		},
	};
}
