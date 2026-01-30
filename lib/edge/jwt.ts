export type EdgeAuthTokenPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

function base64UrlToUint8Array(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = normalized + (pad ? "=".repeat(4 - pad) : "");
  const binary = atob(padded);

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function textToUint8Array(input: string) {
  return new TextEncoder().encode(input);
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    textToUint8Array(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

export async function verifyJwtHs256(token: string, secret: string): Promise<EdgeAuthTokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, sigPart] = parts;
  const data = `${headerPart}.${payloadPart}`;

  const key = await importHmacKey(secret);
  const sig = base64UrlToUint8Array(sigPart);

  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    textToUint8Array(data)
  );

  if (!ok) return null;

  try {
    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadPart));
    const payload = JSON.parse(payloadJson) as EdgeAuthTokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}
