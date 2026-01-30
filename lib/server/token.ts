import crypto from "node:crypto";

export type AuthTokenPayload = {
  sub: string; // user id
  email: string;
  iat: number; // epoch seconds
  exp: number; // epoch seconds
};

function base64UrlEncode(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecodeToBuffer(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = normalized + (pad ? "=".repeat(4 - pad) : "");
  return Buffer.from(padded, "base64");
}

function getSecret() {
  // Untuk produksi: gunakan env AUTH_SECRET.
  // Fallback ini hanya untuk local dev agar tidak crash.
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

export function signToken(payload: AuthTokenPayload): string {
  const header = { alg: "HS256", typ: "JWT" } as const;
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerPart}.${payloadPart}`;

  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest();
  const sigPart = base64UrlEncode(sig);

  return `${data}.${sigPart}`;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, sigPart] = parts;
  const data = `${headerPart}.${payloadPart}`;

  const expectedSig = crypto.createHmac("sha256", getSecret()).update(data).digest();
  const actualSig = base64UrlDecodeToBuffer(sigPart);

  if (actualSig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(actualSig, expectedSig)) return null;

  try {
    const payloadJson = base64UrlDecodeToBuffer(payloadPart).toString("utf8");
    const payload = JSON.parse(payloadJson) as AuthTokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}
