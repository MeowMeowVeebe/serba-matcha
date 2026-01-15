import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { hashPassword } from "@/lib/server/password";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/server/rateLimit";
import { logAudit } from "@/lib/server/auditLog";
import { revokeAllRefreshTokensForUser } from "@/lib/server/refreshTokens";
import { clearAuthCookies } from "@/lib/server/authCookies";
import { withServerTiming } from "@/lib/server/observability";

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(req: Request) {
  return withServerTiming("auth.reset_password", async () => {
  const ip = getClientIp(req);
  const rl = await checkRateLimit({
    key: `reset:${ip}`,
    rule: { windowMs: 60_000, max: 5 },
  });
  if (!rl.ok) {
    await logAudit({ action: "auth.reset_password.rate_limited", ip });
    return tooManyRequests(rl.retryAfterSeconds);
  }

  let body: { token?: string; newPassword?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ message: "Request tidak valid." }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const newPassword = body.newPassword ?? "";

  if (!token || !newPassword) {
    return NextResponse.json(
      { message: "Token dan password baru wajib diisi." },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { message: "Password baru minimal 8 karakter." },
      { status: 400 }
    );
  }

  const tokenHash = sha256Hex(token);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      consumedAt: true,
    },
  });

  if (!row || row.consumedAt) {
    await logAudit({ action: "auth.reset_password.failed", ip, meta: { reason: "invalid" } });
    return NextResponse.json({ message: "Token tidak valid." }, { status: 400 });
  }

  if (row.expiresAt.getTime() < Date.now()) {
    await logAudit({ action: "auth.reset_password.failed", ip, userId: row.userId, meta: { reason: "expired" } });
    return NextResponse.json({ message: "Token sudah kedaluwarsa." }, { status: 400 });
  }

  const pass = hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordAlgo: pass.algo,
        passwordIter: pass.iterations,
        passwordSalt: pass.salt,
        passwordHash: pass.hash,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  // keamanan: invalidate semua refresh token (logout semua device)
  await revokeAllRefreshTokensForUser(row.userId);
  await logAudit({ action: "auth.reset_password.success", userId: row.userId, ip });

  const res = NextResponse.json({ message: "Password berhasil direset. Silakan login." });
  clearAuthCookies(res);
  return res;
  });
}
