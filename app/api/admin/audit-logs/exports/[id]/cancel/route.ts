import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";
import { logAudit } from "@/lib/server/auditLog";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withServerTiming("admin.audit_logs.exports.cancel", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.cancel.forbidden",
    });
    if (!auth.ok) return auth.res;

    const { id } = await ctx.params;
    const job = await prisma.auditLogExportJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (job.requestedByUserId && job.requestedByUserId !== auth.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
      return NextResponse.json({ message: "No-op" });
    }

    await prisma.auditLogExportJob.update({
      where: { id },
      data: { status: "cancelled", leaseUntil: null, error: "Cancelled by user" },
    });

    await logAudit({ action: "admin.audit_logs.exports.cancel", userId: auth.user.id, ip: auth.ip, meta: { jobId: id } });

    return NextResponse.json({ message: "Cancelled" });
  });
}
