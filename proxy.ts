import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtHs256 } from "@/lib/edge/jwt";
import { parseCookieHeader } from "@/lib/edge/cookies";
import { ACCESS_COOKIE_NAME } from "@/lib/server/authCookies";

const PROTECTED_PATHS = ["/dashboard", "/settings", "/admin"];
const AUTH_PAGES = [
  "/login",
  "/register",
  "/",
  "/forgot-password",
  "/reset-password",
  "/reset-password/success",
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

  if (isAuthed && isPathMatch(pathname, AUTH_PAGES)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (!isAuthed && isPathMatch(pathname, PROTECTED_PATHS)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
