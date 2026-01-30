import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/server/userStore";
import { verifyPasswordAsync } from "@/lib/server/password";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "@/lib/server/authConfig";
import { signToken } from "@/lib/server/token";
import { setAccessCookie, setRefreshCookie } from "@/lib/server/authCookies";
import { createRefreshToken } from "@/lib/server/refreshTokens";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/server/rateLimit";
import { logAudit } from "@/lib/server/auditLog";
import { prisma } from "@/lib/server/prisma";
import { withServerTiming } from "@/lib/server/observability";

export async function POST(req: Request) {
  return withServerTiming("auth.login", async () => {
  const ip = getClientIp(req);
  
  // Rate limit check - fast path
  const rl = await checkRateLimit({
    key: `login:${ip}`,
    rule: { windowMs: 60_000, max: 10 },
  });
  if (!rl.ok) {
    // Non-blocking audit log
    logAudit({ action: "auth.login.rate_limited", ip });
    return tooManyRequests(rl.retryAfterSeconds);
  }

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Non-blocking audit log
      logAudit({ action: "auth.login.failed", ip, meta: { email } });
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    // Use async password verification for non-blocking
    const passwordValid = await verifyPasswordAsync(password, user.password);
    if (!passwordValid) {
      // Non-blocking audit log
      logAudit({ action: "auth.login.failed", userId: user.id, ip, meta: { email } });
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    // Generate tokens in parallel - no need to wait for cleanup
    const now = Math.floor(Date.now() / 1000);
    const [accessToken, refresh] = await Promise.all([
      Promise.resolve(signToken({
        sub: user.id,
        email: user.email,
        iat: now,
        exp: now + ACCESS_TOKEN_TTL_SECONDS,
      })),
      createRefreshToken(user.id),
    ]);

    // Fresh query to get latest roles (bypass any cache)
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { roles: { include: { role: true } } },
    });
    const roles = freshUser?.roles.map((r) => r.role.name) ?? [];

    const res = NextResponse.json({
      message: "Login successful.",
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role,
        roles: roles,
      },
    });

    setAccessCookie(res, accessToken, ACCESS_TOKEN_TTL_SECONDS);
    setRefreshCookie(res, refresh.token, REFRESH_TOKEN_TTL_SECONDS);

    // Non-blocking audit log
    logAudit({ action: "auth.login.success", userId: user.id, ip });
    return res;
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  });
}
