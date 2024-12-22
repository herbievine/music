import { createFileRoute } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { Favorites } from "../components/home/favorites";
import { SearchResults } from "../components/home/search-results";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });

  return (
    <div className="px-4 flex flex-col space-y-6">
      <input
        type="text"
        placeholder="Search..."
        className="w-full px-4 py-2 rounded-xl text-zinc-100 bg-zinc-800 outline-none"
        value={query ?? ""}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
      />
      {query.length > 0 ? <SearchResults q={query} /> : <Favorites />}
    </div>
  );
}
