import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export type RateLimitRule = {
  windowMs: number;
  max: number;
};

export async function checkRateLimit(params: {
  key: string;
  rule: RateLimitRule;
}): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const now = Date.now();
  const since = new Date(now - params.rule.windowMs);

  const count = await prisma.rateLimitEvent.count({
    where: { key: params.key, createdAt: { gt: since } },
  });

  if (count >= params.rule.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil(params.rule.windowMs / 1000));
    return { ok: false, retryAfterSeconds };
  }

  await prisma.rateLimitEvent.create({ data: { key: params.key } });

  // Best-effort cleanup (biar DB tidak membesar)
  await prisma.rateLimitEvent.deleteMany({
    where: { createdAt: { lt: new Date(now - 24 * 60 * 60 * 1000) } },
  });

  return { ok: true };
}

export function tooManyRequests(retryAfterSeconds: number) {
  const res = NextResponse.json({ message: "Terlalu banyak percobaan. Coba lagi nanti." }, { status: 429 });
  res.headers.set("Retry-After", String(retryAfterSeconds));
  return res;
}

export function getClientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
