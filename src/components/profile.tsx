"use client";

import { User } from "@supabase/supabase-js";
import Image from "next/image";

type ProfileProps = {
  user: User;
};

export default function Profile({ user }: ProfileProps) {
  return (
    <div className={"w-full flex items-center space-x-2"}>
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
  );
}
