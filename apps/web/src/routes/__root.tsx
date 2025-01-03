import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { useState } from "react";
import { trpc } from "../utils/trpc";
import { httpBatchLink } from "@trpc/client";
import { NuqsAdapter } from "nuqs/adapters/react";
import { Player } from "../components/player/player";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // url: "http://localhost:8787/trpc",
          url: "https://haxel.herbievine.com/trpc",
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <main className="max-w-lg mx-auto flex flex-col py-2">
            <div className="relative">
              <Outlet />
              <Player />
            </div>
          </main>
        </NuqsAdapter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
