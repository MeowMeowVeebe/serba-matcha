import crypto from "node:crypto";
import { env } from "./env";
import { getClientIp } from "./rateLimit";

function parseAllowlist(v: string) {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isIpAllowed(ip: string, allowlist: string[]) {
  if (allowlist.length === 0) return true;
  return allowlist.some((rule) => ip === rule || ip.startsWith(rule));
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Verify cron caller using:
 * - optional IP allowlist
 * - optional CRON_SECRET via header x-cron-secret
 * - optional HMAC signature via headers x-cron-ts (unix ms) and x-cron-signature
 *
 * Signature format: hex(HMAC_SHA256(CRON_HMAC_SECRET, `${ts}.${body}`))
 */
export async function verifyCronRequest(req: Request) {
  const ip = getClientIp(req);

  const allowlist = parseAllowlist(env.CRON_IP_ALLOWLIST);
  if (!isIpAllowed(ip, allowlist)) {
    return { ok: false as const, status: 403, message: "IP not allowed" };
  }

  if (env.CRON_SECRET) {
    const secret = req.headers.get("x-cron-secret") ?? "";
    if (secret !== env.CRON_SECRET) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }
  }

  if (env.CRON_HMAC_SECRET) {
    const ts = req.headers.get("x-cron-ts") ?? "";
    const sig = req.headers.get("x-cron-signature") ?? "";
    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum)) {
      return { ok: false as const, status: 401, message: "Missing/invalid x-cron-ts" };
    }

    // allow 5 min skew
    const skew = Math.abs(Date.now() - tsNum);
    if (skew > 5 * 60 * 1000) {
      return { ok: false as const, status: 401, message: "Timestamp skew too large" };
    }

    let body = "";
    // Only include body for non-GET/HEAD.
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.clone().text();
    }

    const expected = crypto
      .createHmac("sha256", env.CRON_HMAC_SECRET)
      .update(`${ts}.${body}`)
      .digest("hex");

    if (!sig || !safeEqual(sig, expected)) {
      return { ok: false as const, status: 401, message: "Bad signature" };
    }
  }

  return { ok: true as const };
}
