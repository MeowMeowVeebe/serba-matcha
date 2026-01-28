import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/server/authCookies";
import { getRefreshTokenFromRequest, getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { revokeRefreshToken } from "@/lib/server/refreshTokens";
import { logAudit } from "@/lib/server/auditLog";
import { getClientIp } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  const refresh = getRefreshTokenFromRequest(req);
  if (refresh) {
    await revokeRefreshToken(refresh);
  }

  await logAudit({ action: "auth.logout", userId: session?.sub, ip: getClientIp(req) });

  const res = NextResponse.json({ message: "Logout berhasil." });
  clearAuthCookies(res);
  return res;
}
