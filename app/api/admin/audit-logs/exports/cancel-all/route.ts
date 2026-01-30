import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";
import { logAudit } from "@/lib/server/auditLog";

export async function POST(req: Request) {
  return withServerTiming("admin.audit_logs.exports.cancel_all", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.cancel_all.forbidden",
    });
    if (!auth.ok) return auth.res;

    const result = await prisma.auditLogExportJob.updateMany({
      where: {
        requestedByUserId: auth.user.id,
        status: { in: ["pending", "running"] },
      },
      data: {
        status: "cancelled",
        leaseUntil: null,
        error: "Cancelled by user",
      },
    });

    await logAudit({
      action: "admin.audit_logs.exports.cancel_all",
      userId: auth.user.id,
      ip: auth.ip,
      meta: { cancelled: result.count },
    });

    return NextResponse.json({ cancelled: result.count });
  });
}
