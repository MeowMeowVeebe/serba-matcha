import crypto from "node:crypto";

/**
 * Compute a stable, strong ETag from JSON-serializable data.
 * We use SHA-256 to avoid collisions.
 */
export function computeJsonEtag(data: unknown) {
  const json = JSON.stringify(data);
  const hash = crypto.createHash("sha256").update(json).digest("base64url");
  // strong ETag (quoted)
  return `"${hash}"`;
}

export function isEtagMatch(ifNoneMatch: string | null, etag: string) {
  if (!ifNoneMatch) return false;
  // Support simple exact match and list forms: W/"...", "...", "...", ...
  const candidates = ifNoneMatch
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return candidates.includes(etag) || candidates.includes(`W/${etag}`);
}
