import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const session = await supabase.auth.getSession();
  const publicRoutes = ["/profile", "/callback"];

  if (
    !session?.data?.session &&
    !publicRoutes.includes(request.nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL("/profile", request.nextUrl.origin));
  }

  return response;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
