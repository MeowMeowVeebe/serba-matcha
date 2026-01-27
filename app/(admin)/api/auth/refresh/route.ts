import { NextResponse } from "next/server";
import { getRefreshTokenFromRequest } from "@/lib/server/authSession";
import { rotateRefreshToken, cleanupRefreshTokens } from "@/lib/server/refreshTokens";
import { findUserById } from "@/lib/server/userStore";
import { signToken } from "@/lib/server/token";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "@/lib/server/authConfig";
import { setAccessCookie, setRefreshCookie, clearAuthCookies } from "@/lib/server/authCookies";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/server/rateLimit";
import { logAudit } from "@/lib/server/auditLog";

import { withServerTiming } from "@/lib/server/observability";

export async function POST(req: Request) {
  return withServerTiming("auth.refresh", async () => {
  const ip = getClientIp(req);
  const rl = await checkRateLimit({
    key: `refresh:${ip}`,
    rule: { windowMs: 60_000, max: 30 },
  });
  if (!rl.ok) {
    await logAudit({ action: "auth.refresh.rate_limited", ip });
    return tooManyRequests(rl.retryAfterSeconds);
  }

  const refresh = getRefreshTokenFromRequest(req);
  if (!refresh) {
    await logAudit({ action: "auth.refresh.missing_token", ip });
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await cleanupRefreshTokens();

  const rotated = await rotateRefreshToken(refresh);
  if (!rotated) {
    // kemungkinan: token revoked/expired/invalid. Hapus cookies supaya client tidak loop.
    await logAudit({ action: "auth.refresh.invalid_token", ip });
    const res = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const user = await findUserById(rotated.userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = Math.floor(Date.now() / 1000);
  const accessToken = signToken({
    sub: user.id,
    email: user.email,
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
  });

  const res = NextResponse.json({ message: "OK" });
  setAccessCookie(res, accessToken, ACCESS_TOKEN_TTL_SECONDS);
  setRefreshCookie(res, rotated.token, REFRESH_TOKEN_TTL_SECONDS);

  await logAudit({ action: "auth.refresh.success", userId: user.id, ip });
  return res;
  });
}
