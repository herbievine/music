import type { Track } from "@statsfm/spotify.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import id3, { TagConstants } from "node-id3";
import { getArrayBuffer } from "../utils/get-array-buffer.js";

dayjs.extend(utc);

export async function write(song: Track, data: ArrayBuffer) {
	const imageArrayBuffer = await getArrayBuffer(song.album.images[0].url);

	return id3.write(
		{
			title: song.name ?? undefined,
			artist: song.artists.map((a) => a.name).join("/") ?? undefined,
			album: song.album.name ?? undefined,
			year: dayjs.utc(song.album.release_date).format("YYYY"),
			// genre: song.album.genres[0] ?? undefined,
			trackNumber: `${song.track_number}/${song.album.total_tracks}`,
			partOfSet: song.disc_number.toString(),
			image: {
				mime: "image/jpeg",
				type: {
					id: TagConstants.AttachedPicture.PictureType.FRONT_COVER,
				},
				description: "Cover",
				imageBuffer: Buffer.from(imageArrayBuffer),
			},
		},
		Buffer.from(data),
	);
}
