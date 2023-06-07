import "@/styles/globals.css";
import Player from "@/components/player";
import cn from "@/lib/cn";
import { Inter } from "next/font/google";
import Header from "@/components/header";
import { getServerSideSession } from "@/lib/user";

const inter = Inter({ subsets: ["latin"] });

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await getServerSideSession();

  return (
    <html lang="en">
      <body className={cn("bg-neutral-950 text-white", inter.className)}>
        <div className="max-w-xl mx-auto h-screen w-full flex flex-col justify-between">
          <div className="pt-8 pb-24 px-4 flex flex-col space-y-4 items-center">
            <Header session={session} />
            <main className="w-full">{children}</main>
          </div>
          <Player />
        </div>
      </body>
    </html>
  );
}
