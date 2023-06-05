"use client";

import GoogleIcon from "@/assets/google-icon";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Login() {
  const { auth } = createClientComponentClient();

  return (
    <button
      className="rounded-lg w-full py-3 bg-neutral-800 flex space-x-2 justify-center items-center"
      onClick={() =>
        auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/callback`,
          },
        })
      }
    >
      <GoogleIcon className="w-3.5 h-3.5 fill-blue-400" />
      <span className="font-bold text-blue-400">Login with Google</span>
    </button>
  );
}
