"use client";

import ChevronIcon from "@/assets/chevron-icon";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Session } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

type HeaderProps = {
  session: Session | null;
};

export default function Header({ session }: HeaderProps) {
  const { push, back } = useRouter();
  const path = usePathname();
  const query = useSearchParams();

  if (query.get("reload")) {
    push("/");
  }

  return (
    <header className="w-full flex justify-between items-center relative">
      {path !== "/" ? (
        <button className="flex space-x-2 items-center" onClick={back}>
          <ChevronIcon className="w-3.5 h-3.5 fill-blue-400 rotate-90" />
          <span className="font-bold text-blue-400">Back</span>
        </button>
      ) : (
        <h1 className="font-black text-3xl">Music</h1>
      )}
      {session?.user.user_metadata.avatar_url && (
        <Link href="/profile" className="font-bold">
          {session.user.user_metadata.full_name}
        </Link>
      )}
    </header>
  );
}
