import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/server/userStore";
import { cleanupExpiredTokens, createPasswordResetToken } from "@/lib/server/resetTokens";
import { isSmtpConfigured, sendResetPasswordEmail } from "@/lib/server/mailer";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/server/rateLimit";
import { logAudit } from "@/lib/server/auditLog";

function getAppUrl(req: Request) {
  const fromEnv = process.env.APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit({
    key: `forgot:${ip}`,
    rule: { windowMs: 60_000, max: 5 },
  });
  if (!rl.ok) {
    await logAudit({ action: "auth.forgot_password.rate_limited", ip });
    return tooManyRequests(rl.retryAfterSeconds);
  }

  let body: { email?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const email = (body.email ?? "").trim().toLowerCase();

  // Selalu generic response untuk mencegah user enumeration.
  const generic = { message: "Jika email terdaftar, instruksi reset password akan dikirim." };

  if (!email) {
    return NextResponse.json(generic);
  }

  // Best-effort cleanup
  await cleanupExpiredTokens();

  const user = await findUserByEmail(email);
  if (!user) {
    await logAudit({ action: "auth.forgot_password.request", ip, meta: { email, known: false } });
    return NextResponse.json(generic);
  }

  await logAudit({ action: "auth.forgot_password.request", userId: user.id, ip, meta: { known: true } });

  const { token } = await createPasswordResetToken({ userId: user.id });

  const baseUrl = getAppUrl(req);
  const resetUrl = new URL("/reset-password", baseUrl);
  resetUrl.searchParams.set("token", token);

  // Jika SMTP sudah terkonfigurasi, kirim email.
  if (isSmtpConfigured()) {
    try {
      await sendResetPasswordEmail({
        to: user.email,
        name: user.name,
        resetUrl: resetUrl.toString(),
      });
    } catch {
      // jangan bocorkan detail; tetap generic response
    }
  }

  // Untuk dev: tampilkan link reset agar gampang dites.
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ...generic, resetUrl: resetUrl.toString() });
  }

  return NextResponse.json(generic);
}
