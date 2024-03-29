import { Album } from "@/schemas/album";
import { Song } from "@/schemas/song";
import { Media, MediaAlbum, MediaSong } from "@/types/media";

export function getMediaFromSong(song: Song): MediaSong {
  return {
    id: song.trackId,
    title: song.trackName,
    artist: song.artistName,
    coverLinkLow: song.artworkUrl100,
    coverLinkHigh: song.artworkUrl100.replace("100x100", "600x600"),
    type: "song",
    genre: song.primaryGenreName,
    releaseDate: song.releaseDate,
    album: {
      id: song.collectionId,
      title: song.collectionName,
      artist: song.artistName,
      coverLinkLow: song.artworkUrl100,
      coverLinkHigh: song.artworkUrl100.replace("100x100", "600x600"),
      genre: song.primaryGenreName,
      releaseDate: song.releaseDate,
      songs: [],
      type: "album",
    },
    duration: song.trackTimeMillis,
    trackNumber: song.trackNumber,
    audioLink: song.previewUrl,
    raw: song,
  };
}

export function getMediaFromAlbum(album: Album): MediaAlbum {
  return {
    id: album.collectionId,
    title: album.collectionName,
    artist: album.artistName,
    coverLinkLow: album.artworkUrl100,
    coverLinkHigh: album.artworkUrl100.replace("100x100", "600x600"),
    type: "album",
    songs: [],
    genre: album.primaryGenreName,
    releaseDate: album.releaseDate,
    raw: album,
  };
}

export function getMediaFromSongOrAlbum(songOrAlbum: Song | Album): Media {
  if (songOrAlbum.wrapperType === "track") {
    return getMediaFromSong(songOrAlbum);
  }

  return getMediaFromAlbum(songOrAlbum);
}
