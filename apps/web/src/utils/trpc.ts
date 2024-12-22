import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@music/haxel";

export const trpc = createTRPCReact<AppRouter>();
