import { prisma } from "./prisma";

export async function logAudit(params: {
  action: string;
  userId?: string;
  ip?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId,
        ip: params.ip,
        meta: params.meta ? JSON.stringify(params.meta) : undefined,
      },
    });
  } catch {
    // best-effort only
  }
}
