import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";
import { logAudit } from "@/lib/server/auditLog";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withServerTiming("admin.audit_logs.exports.retry", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.retry.forbidden",
    });
    if (!auth.ok) return auth.res;

    const { id } = await ctx.params;
    const job = await prisma.auditLogExportJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (job.requestedByUserId && job.requestedByUserId !== auth.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (job.status !== "failed") {
      return NextResponse.json({ message: "Only failed jobs can be retried" }, { status: 400 });
    }

    await prisma.auditLogExportJob.update({
      where: { id },
      data: {
        status: "pending",
        leaseUntil: null,
        error: null,
        rowsWritten: 0,
      },
    });

    await logAudit({ action: "admin.audit_logs.exports.retry", userId: auth.user.id, ip: auth.ip, meta: { jobId: id } });

    return NextResponse.json({ message: "Queued" });
  });
}
