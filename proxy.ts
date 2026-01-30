import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtHs256 } from "@/lib/edge/jwt";
import { parseCookieHeader } from "@/lib/edge/cookies";
import { ACCESS_COOKIE_NAME } from "@/lib/server/authCookies";

const PROTECTED_PATHS = ["/dashboard", "/settings", "/admin"];
// Seller paths - require seller or admin role
const SELLER_PATHS = ["/dashboard/penjual", "/dashboard/seller"];
// Customer-only paths - sellers cannot access these
const CUSTOMER_ONLY_PATHS = [
  "/dashboard/home",
  "/dashboard/settings",
  "/dashboard/security",
  "/dashboard/transactions",
];
const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/reset-password/success",
  "/dashboard/login",
  "/dashboard/register",
  "/dashboard/forgot-password",
  "/dashboard/reset-password",
  "/dashboard/reset-password/success",
];
// Public pages that should NOT redirect logged-in users
const PUBLIC_PAGES = ["/", "/home", "/menu", "/cart", "/about_us", "/our_team"];

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

  // Public pages - allow access regardless of auth status
  if (isPathMatch(pathname, PUBLIC_PAGES)) {
    return NextResponse.next();
  }

  // Auth pages (login, register, etc) - redirect to home if already logged in
  if (isPathMatch(pathname, AUTH_PAGES)) {
    if (isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
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

  // Helper function to check user roles
  async function getUserRoles(req: NextRequest): Promise<{ user: any; isSeller: boolean; isAdmin: boolean } | null> {
    const apiUrl = new URL("/api/auth/me", req.nextUrl.origin);
    const meRes = await fetch(apiUrl, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    }).catch(() => null);

    if (!meRes || meRes.status === 401) return null;

    const meJson = await meRes.json().catch(() => null);
    const user = meJson?.user;
    if (!user) return null;

    const norm = (v: any) => (typeof v === "string" ? v.toLowerCase().trim() : "");
    
    const checkRole = (roleName: string) => {
      return norm(user.role) === roleName ||
        (Array.isArray(user.roles) && user.roles.some((r: any) => {
          const rName = norm(typeof r === "string" ? r : r?.name);
          return rName === roleName;
        }));
    };

    const isSeller = checkRole("seller") || checkRole("penjual");
    const isAdmin = checkRole("admin");

    return { user, isSeller, isAdmin };
  }

  // Customer-only paths - sellers (non-admin) cannot access these, return 404
  if (isPathMatch(pathname, CUSTOMER_ONLY_PATHS)) {
    const userInfo = await getUserRoles(req);
    
    if (!userInfo) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // If seller-only (not admin), block access to customer pages
    if (userInfo.isSeller && !userInfo.isAdmin) {
      // Return 404 for sellers trying to access customer pages
      const url = req.nextUrl.clone();
      url.pathname = "/404";
      return NextResponse.rewrite(url);
    }
  }

  // Seller paths - require seller or admin role
  if (isPathMatch(pathname, SELLER_PATHS)) {
    const userInfo = await getUserRoles(req);

    if (!userInfo) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (!userInfo.isSeller && !userInfo.isAdmin) {
      // User doesn't have permission - redirect to customer dashboard
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard/home";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
