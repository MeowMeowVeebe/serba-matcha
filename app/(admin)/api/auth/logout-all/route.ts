import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { clearAuthCookies } from "@/lib/server/authCookies";
import { revokeAllRefreshTokensForUser } from "@/lib/server/refreshTokens";
import { logAudit } from "@/lib/server/auditLog";
import { getClientIp } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await revokeAllRefreshTokensForUser(session.sub);
  await logAudit({ action: "auth.logout_all", userId: session.sub, ip: getClientIp(req) });

  const res = NextResponse.json({ message: "Logout semua device berhasil." });
  clearAuthCookies(res);
  return res;
}
