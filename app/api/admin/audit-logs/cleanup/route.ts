import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { env } from "@/lib/server/env";
import { verifyCronRequest } from "@/lib/server/cronAuth";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/server/rateLimit";

function parseRetentionDays(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export async function POST(req: Request) {
  return withServerTiming("admin.audit_logs.cleanup", async () => {
    // Require both: admin permission AND cron secret (if configured)
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.cleanup.forbidden",
    });
    if (!auth.ok) return auth.res;

    const ip = getClientIp(req);

    // Rate limit: cleanup is a heavy operation
    const rl = await checkRateLimit({
      key: `audit_cleanup:${ip}`,
      rule: { windowMs: 60_000, max: 3 },
    });
    if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

    // Extra protection for maintenance endpoints
    const cron = await verifyCronRequest(req);
    if (!cron.ok) {
      return NextResponse.json({ message: cron.message }, { status: cron.status });
    }

    const days = parseRetentionDays(env.AUDIT_RETENTION_DAYS);
    if (!days) return NextResponse.json({ message: "AUDIT_RETENTION_DAYS disabled" }, { status: 400 });

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });

    return NextResponse.json({ deleted: result.count, cutoff: cutoff.toISOString(), retentionDays: days });
  });
}
