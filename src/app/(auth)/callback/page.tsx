"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function CallbackPage() {
  const supabase = createClientComponentClient();
  const { replace } = useRouter();

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        replace("/profile");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, replace]);

  return <div className="w-full flex justify-center">Authenticating...</div>;
}
