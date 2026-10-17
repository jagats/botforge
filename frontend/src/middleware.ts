import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup"];
const DASHBOARD_PREFIX = "/dashboard";
const ADMIN_PREFIX = "/admin";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("botforge_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // 2. No token → redirect to /login
  if (!token && (pathname.startsWith(DASHBOARD_PREFIX) || pathname.startsWith(ADMIN_PREFIX))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Admin paths → verify superadmin claim
  if (token && pathname.startsWith(ADMIN_PREFIX)) {
    try {
      // Decode JWT payload (second segment)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      if (payload.role !== "superadmin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
