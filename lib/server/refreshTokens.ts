import crypto from "node:crypto";
import { prisma } from "./prisma";
import { REFRESH_TOKEN_TTL_SECONDS } from "./authConfig";

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createRefreshToken(userId: string) {
  const token = generateRefreshToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { token, expiresAt };
}

export async function rotateRefreshToken(token: string) {
  const tokenHash = sha256Hex(token);

  const row = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!row || row.revokedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  // revoke old
  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });

  // issue new
  const next = await createRefreshToken(row.userId);
  return { userId: row.userId, token: next.token };
}

export async function revokeRefreshToken(token: string) {
  const tokenHash = sha256Hex(token);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function cleanupRefreshTokens() {
  await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
    },
  });
}
