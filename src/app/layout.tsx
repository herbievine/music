"use client";

import ChevronIcon from "@/assets/chevron-icon";
import Player from "@/components/player";
import cn from "@/lib/cn";
import { useQueueStore } from "@/store/queue";
import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const { back } = useRouter();
  const path = usePathname();

  return (
    <html lang="en">
      <body className={cn("bg-neutral-950 text-white", inter.className)}>
        <div className="max-w-xl mx-auto h-screen w-full flex flex-col justify-between">
          <div className="pt-8 pb-24 px-4 flex flex-col space-y-4 items-center">
            <header className="w-full">
              {path !== "/" ? (
                <button className="flex space-x-2 items-center" onClick={back}>
                  <ChevronIcon className="w-3.5 h-3.5 fill-blue-400 rotate-90" />
                  <span className="font-bold text-blue-400">Back</span>
                </button>
              ) : (
                <h1 className="font-black text-3xl">Music</h1>
              )}
            </header>
            <main className="w-full">{children}</main>
          </div>
          <Player />
        </div>
      </body>
    </html>
  );
}
