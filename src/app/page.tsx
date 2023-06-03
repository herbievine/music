import Search from "@/components/search";

export const metadata = {
  title: "Music",
  description: "Search for songs and albums.",
};

export default async function HomePage() {
  return <Search />;
}
