import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect all /admin routes except login
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    const sessionCookie = request.cookies.get("saf_admin_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // We defer actual JWT verification to Server Actions / RSC
    // because standard edge runtime (Next.js middleware) doesn't support jsonwebtoken well.
    // However, for Cloudflare workers via vinext, this is just a quick routing check.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
