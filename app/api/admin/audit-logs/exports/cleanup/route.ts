import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { env } from "@/lib/server/env";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/server/rateLimit";
import { verifyCronRequest } from "@/lib/server/cronAuth";
import { logAudit } from "@/lib/server/auditLog";
import fs from "node:fs/promises";
import path from "node:path";
import { resolveExportPath } from "@/lib/server/exportStorage";

function parseRetentionDays(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

async function safeUnlink(fullPath: string) {
  try {
    await fs.unlink(fullPath);
  } catch {
    // ignore
  }
}

export async function POST(req: Request) {
  return withServerTiming("admin.audit_logs.exports.cleanup", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.cleanup.forbidden",
    });
    if (!auth.ok) return auth.res;

    const ip = getClientIp(req);
    const rl = await checkRateLimit({ key: `exports_cleanup:${ip}`, rule: { windowMs: 60_000, max: 2 } });
    if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

    const cron = await verifyCronRequest(req);
    if (!cron.ok) return NextResponse.json({ message: cron.message }, { status: cron.status });

    const days = parseRetentionDays(env.EXPORT_RETENTION_DAYS);
    if (!days) return NextResponse.json({ message: "EXPORT_RETENTION_DAYS disabled" }, { status: 400 });

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const oldJobs = await prisma.auditLogExportJob.findMany({
      where: { createdAt: { lt: cutoff }, OR: [{ status: "completed" }, { status: "failed" }] },
      select: { id: true, filePath: true },
      take: 500,
    });

    let deletedFiles = 0;
    for (const j of oldJobs) {
      if (j.filePath) {
        await safeUnlink(resolveExportPath(j.filePath));
        deletedFiles++;
      }
    }

    const deletedJobs = await prisma.auditLogExportJob.deleteMany({
      where: { createdAt: { lt: cutoff }, OR: [{ status: "completed" }, { status: "failed" }] },
    });

    // best-effort: remove empty export dir
    try {
      await fs.rm(path.join(env.EXPORT_DIR, "audit-logs"), { recursive: false, force: false });
    } catch {
      // ignore
    }

    await logAudit({
      action: "admin.audit_logs.exports.cleanup",
      userId: auth.user.id,
      ip: auth.ip,
      meta: { deletedJobs: deletedJobs.count, deletedFiles, cutoff: cutoff.toISOString() },
    });

    return NextResponse.json({ deletedJobs: deletedJobs.count, deletedFiles, cutoff: cutoff.toISOString() });
  });
}
