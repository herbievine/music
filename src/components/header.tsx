"use client";

import ChevronIcon from "@/assets/chevron-icon";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Session } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

type HeaderProps = {
  session: Session | null;
};

export default function Header({ session }: HeaderProps) {
  const { push } = useRouter();
  const path = usePathname();

  return (
    <header className="w-full flex justify-between items-center relative">
      {path !== "/" ? (
        <button
          className="flex space-x-2 items-center"
          onClick={() => push("/")}
        >
          <ChevronIcon className="w-3.5 h-3.5 fill-blue-400 rotate-90" />
          <span className="font-bold text-blue-400">Music</span>
        </button>
      ) : (
        <h1 className="font-black text-3xl">Music</h1>
      )}
      {session?.user.user_metadata.avatar_url && (
        <Link href="/profile" className="flex space-x-2 items-center">
          <span className="font-bold text-sm">
            {session.user.user_metadata.full_name}
          </span>
          <Image
            src={session.user.user_metadata.avatar_url}
            alt="Profile picture"
            width={30}
            height={30}
            className="rounded-full"
          />
        </Link>
      )}
    </header>
  );
}
