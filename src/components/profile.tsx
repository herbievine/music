"use client";

import SignoutIcon from "@/assets/signout-icon";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ProfileProps = {
  user: User;
};

export default function Profile({ user }: ProfileProps) {
  const { auth } = createClientComponentClient();
  const { refresh } = useRouter();

  return (
    <div className="flex flex-col space-y-4">
      <div className="w-full flex items-center space-x-2">
        <Image
          src={user.user_metadata.avatar_url}
          alt="Profile picture"
          width={45}
          height={45}
          className="rounded-lg"
        />
        <div className="flex flex-col">
          <p className="font-semibold">{user.user_metadata.full_name}</p>
          <p className="text-sm font-semibold text-neutral-500">{user.email}</p>
        </div>
      </div>
      <button
        className="rounded-lg w-full py-3 bg-neutral-800 flex space-x-2 justify-center items-center"
        onClick={async () => {
          await auth.signOut();
          refresh();
        }}
      >
        <SignoutIcon className="w-3.5 h-3.5 fill-red-400" />
        <span className="font-bold text-red-400">Logout</span>
      </button>
    </div>
  );
}
