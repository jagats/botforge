import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup"];
const DASHBOARD_PREFIX = "/dashboard";
const ADMIN_PREFIX = "/admin";

function decodeJwtPayload(token: string): any | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public marketing and auth paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const adminToken = request.cookies.get("botforge_admin_token")?.value;
  const impersonateToken = request.cookies.get("botforge_impersonation_token")?.value;
  const userToken =
    request.cookies.get("botforge_user_token")?.value ||
    request.cookies.get("botforge_token")?.value;

  // 2. Admin portal route protection
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!adminToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = decodeJwtPayload(adminToken);
    if (!payload || payload.role !== "superadmin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 3. Client dashboard route protection
  if (pathname.startsWith(DASHBOARD_PREFIX)) {
    const activeToken = impersonateToken || userToken || adminToken;
    if (!activeToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = decodeJwtPayload(activeToken);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
