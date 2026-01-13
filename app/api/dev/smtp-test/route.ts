import { NextResponse } from "next/server";
import { isSmtpConfigured, sendResetPasswordEmail } from "@/lib/server/mailer";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/server/rateLimit";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const rl = await checkRateLimit({
    key: `smtp-test:${getClientIp(req)}`,
    rule: { windowMs: 60_000, max: 3 },
  });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  let body: { to?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const to = (body.to ?? "").trim();
  if (!to) {
    return NextResponse.json({ message: "Field 'to' wajib diisi" }, { status: 400 });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { message: "SMTP belum dikonfigurasi (cek .env SMTP_*)" },
      { status: 400 }
    );
  }

  const baseUrl = process.env.APP_URL ?? new URL(req.url).origin;

  await sendResetPasswordEmail({
    to,
    name: "Dev Test",
    resetUrl: `${baseUrl.replace(/\/$/, "")}/reset-password?token=dev-test-token`,
  });

  return NextResponse.json({ message: `SMTP OK. Email test dikirim ke ${to}` });
}
