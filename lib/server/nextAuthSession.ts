import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME } from "./authCookies";
import { verifyToken } from "./token";

/**
 * Server Component / Server Action helper: read access token from Next.js cookies store.
 */
export async function getSessionPayloadFromNextCookies() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE_NAME)?.value ?? null;
  if (!token) return null;
  return verifyToken(token);
}
