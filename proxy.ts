import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtHs256 } from "@/lib/edge/jwt";
import { parseCookieHeader } from "@/lib/edge/cookies";
import { ACCESS_COOKIE_NAME } from "@/lib/server/authCookies";

const PROTECTED_PATHS = ["/dashboard", "/settings", "/admin"];
const ADMIN_ONLY_PATHS = ["/dashboard/penjual", "/dashboard/seller"];
const AUTH_PAGES = [
  "/login",
  "/register",
  "/",
  "/forgot-password",
  "/reset-password",
  "/reset-password/success",
  "/dashboard/login",
  "/dashboard/register",
  "/dashboard/forgot-password",
  "/dashboard/reset-password",
  "/dashboard/reset-password/success",
];

function isPathMatch(pathname: string, list: string[]) {
  return list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getSecret() {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/public")) {
    return NextResponse.next();
  }

  // NextRequest.cookies kadang tidak tersedia di edge proxy mode; parse manual.
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  const token = cookies[ACCESS_COOKIE_NAME];

  const session = token ? await verifyJwtHs256(token, getSecret()) : null;
  const isAuthed = Boolean(session);

  // Auth pages are public; redirect only if already logged in.
  if (isPathMatch(pathname, AUTH_PAGES)) {
    if (isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!isAuthed && isPathMatch(pathname, PROTECTED_PATHS)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Admin-only guard for seller/penjual dashboards
  if (isPathMatch(pathname, ADMIN_ONLY_PATHS)) {
    // Fetch user profile using incoming cookies to check role
    const apiUrl = new URL("/api/auth/me", req.nextUrl.origin);
    const meRes = await fetch(apiUrl, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    }).catch(() => null);

    if (!meRes || meRes.status === 401) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const meJson = await meRes.json().catch(() => null);
    const user = meJson?.user;
    const norm = (v: any) => (typeof v === "string" ? v.toLowerCase().trim() : "");
    const hasAdmin =
      user &&
      (norm(user.role) === "admin" ||
        (Array.isArray(user.roles) && user.roles.some((r: any) => norm(typeof r === "string" ? r : r?.name) === "admin")));

    if (!hasAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
