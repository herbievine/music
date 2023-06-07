import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const session = await supabase.auth.getSession();
  const publicRoutes = ["/profile", "/callback"];
  const whitelistedEmailAddresses =
    process.env.WHITELISTED_EMAIL_ADDRESSES?.split(",") || [];

  if (
    (!session?.data ||
      !whitelistedEmailAddresses.includes(
        session?.data?.session?.user?.email ?? ""
      )) &&
    !publicRoutes.includes(request.nextUrl.pathname)
  ) {
    return NextResponse.redirect(
      new URL("/profile?invalid=true", request.nextUrl.origin)
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
