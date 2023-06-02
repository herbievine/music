import useAlbums from "./useAlbums";
import useSongs from "./useSongs";

export default function useSearch(query?: string | null) {
  const { data: songs } = useSongs(query);
  const { data: albums } = useAlbums(query);

  return {
    data: {
      songs,
      albums,
    },
  };
}
