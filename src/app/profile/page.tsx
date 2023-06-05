import Login from "@/components/login";
import Profile from "@/components/profile";
import { getServerSideSession } from "@/lib/user";

export async function generateMetadata() {
  const session = await getServerSideSession();

  if (!session) {
    return {
      title: "Music - Login",
      description: "Search for songs and albums.",
    };
  }

  return {
    title: `${session.user.email}'s Profile`,
    description: `Search for songs and albums.`,
  };
}

export default async function ProfilePage() {
  const session = await getServerSideSession();

  if (!session) {
    return <Login />;
  }

  return <Profile user={session.user} />;
}
