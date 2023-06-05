"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Login() {
  const { auth } = createClientComponentClient();

  return (
    <button
      type="submit"
      className="w-full px-4 py-2 rounded-lg border border-sky-700 bg-sky-600 text-white"
      onClick={() =>
        auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/profile`,
          },
        })
      }
    >
      Login with Google
    </button>
  );
}
