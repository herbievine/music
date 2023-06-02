"use client";

import Player from "@/components/player";
import cn from "@/lib/cn";
import { useQueueStore } from "@/store/queue";
import "@/styles/globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={cn("bg-neutral-950 text-white", inter.className)}>
        <div className="max-w-xl mx-auto h-screen w-full flex flex-col justify-between">
          <main className="pt-8 pb-24 px-4 flex flex-col space-y-4 items-center">
            {children}
          </main>
          <Player />
        </div>
      </body>
    </html>
  );
}
