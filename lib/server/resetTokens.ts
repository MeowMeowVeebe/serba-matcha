import crypto from "node:crypto";
import { prisma } from "./prisma";

const RESET_TTL_MINUTES = 30;

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generateResetToken() {
  // 32 bytes => 64 hex chars
  return crypto.randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(params: { userId: string }) {
  const token = generateResetToken();
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60_000);

  await prisma.passwordResetToken.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function cleanupExpiredTokens() {
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { consumedAt: { not: null } }],
    },
  });
}
