import { useDebounce } from "@uidotdev/usehooks";
import { Link } from "@tanstack/react-router";
import { trpc } from "../../utils/trpc";

type Props = {
  q: string;
};

export function SearchResults({ q }: Props) {
  const debouncedSearchTerm = useDebounce(q, 300);
  const { data, isLoading } = trpc.search.useQuery(debouncedSearchTerm);

  if (q !== debouncedSearchTerm || isLoading) {
    return (
      <ul className="flex flex-col space-y-6">
        {[...new Array(12).fill("0")].map((_, i) => (
          <li key={i} className="flex space-x-4 items-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-lg animate-pulse" />
            <div className="flex flex-col items-start space-y-2">
              <div className="h-5 w-40 bg-zinc-800 rounded-2xl animate-pulse" />
              <div className="h-4 w-52 bg-zinc-800 rounded-2xl animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (!data || data.length === 0) {
    return <span>No results :(</span>;
  }

  return (
    <ul className="flex flex-col space-y-6">
      {data.map((result) => (
        <li key={result.albumId} className="flex space-x-2">
          <Link
            to="/albums/$id"
            params={{
              id: result.albumId.toString(),
            }}
            className="flex space-x-4 items-center"
          >
            <img src={result.url} className="w-12 h-12 rounded-lg" />
            <div className="flex flex-col items-start">
              <span className="line-clamp-1 text-left">{result.name}</span>
              <span className="text-sm text-zinc-500">
                {result.releaseYear} —{" "}
                <span className="uppercase">{result.object}</span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
