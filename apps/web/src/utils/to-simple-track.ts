import type { MusicTrack, MusicTrackSimplified } from "@music/api";
import type { SimpleTrack } from "../store/queue";

export function toSimpleTrack(
	track: MusicTrackSimplified | MusicTrack,
	album: {
		id: string;
		name?: string;
		images: { url: string }[];
	},
): SimpleTrack {
	return {
		id: track.id,
		name: track.name,
		durationMs: track.durationMs,
		artists: track.artists.map(({ id, name }) => ({ id, name })),
		album: {
			id: album.id,
			name: album.name ?? "",
			image: album.images[0].url ?? "",
		},
	};
}
