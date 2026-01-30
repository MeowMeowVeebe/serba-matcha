import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";
import { logAudit } from "@/lib/server/auditLog";

export async function POST(req: Request) {
  return withServerTiming("admin.audit_logs.exports.retry_all_failed", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.retry_all_failed.forbidden",
    });
    if (!auth.ok) return auth.res;

    const result = await prisma.auditLogExportJob.updateMany({
      where: { requestedByUserId: auth.user.id, status: "failed" },
      data: { status: "pending", leaseUntil: null, error: null, rowsWritten: 0 },
    });

    await logAudit({
      action: "admin.audit_logs.exports.retry_all_failed",
      userId: auth.user.id,
      ip: auth.ip,
      meta: { queued: result.count },
    });

    return NextResponse.json({ queued: result.count });
  });
}
