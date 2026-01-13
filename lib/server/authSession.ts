import { verifyToken } from "./token";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./authCookies";

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};

  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("="));
  }

  return out;
}

export function getCookiesFromRequest(req: Request): Record<string, string> {
  return parseCookieHeader(req.headers.get("cookie"));
}

export function getAccessTokenFromRequest(req: Request): string | null {
  const cookies = getCookiesFromRequest(req);
  return cookies[ACCESS_COOKIE_NAME] ?? null;
}

export function getRefreshTokenFromRequest(req: Request): string | null {
  const cookies = getCookiesFromRequest(req);
  return cookies[REFRESH_COOKIE_NAME] ?? null;
}

export function getSessionPayloadFromRequest(req: Request) {
  const token = getAccessTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}
