import { createFileRoute } from "@tanstack/react-router";
import { useDebounce } from "@uidotdev/usehooks";
import { trpc } from "../utils/trpc";
import { useQueryState } from "nuqs";
import { Link } from "@tanstack/react-router";
import { Favorites } from "../components/home/favorites";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [query, setQuery] = useQueryState("q");
  const debouncedSearchTerm = useDebounce(query ?? "", 300);
  const { data } = trpc.search.useQuery(debouncedSearchTerm);

  return (
    <div className="p-2 flex flex-col space-y-4">
      <input
        type="text"
        placeholder="Search..."
        className="w-full px-2 py-1 rounded-md text-gray-900 bg-gray-100 outline-none"
        value={query ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
      />
      {data && data.length > 0 ? (
        <ul className="flex flex-col space-y-6">
          <span>Showing {data.length} results</span>
          {data.map((result) => (
            <li key={result.albumId} className="flex space-x-2">
              <Link
                to="/albums/$id"
                params={{
                  id: result.albumId.toString(),
                }}
                className="flex space-x-4"
              >
                <img src={result.url} className="w-20 h-20 rounded-md" />
                <div className="flex flex-col">
                  <span>Name: {result.name}</span>
                  <span>Track count: {result.trackCount}</span>
                  <span>Released: {result.releaseYear}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <span>No data</span>
      )}
      <Favorites />
    </div>
  );
}
