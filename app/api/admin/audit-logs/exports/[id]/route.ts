import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { env } from "@/lib/server/env";
import { verifyCronRequest } from "@/lib/server/cronAuth";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withServerTiming("admin.audit_logs.exports.get", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.get.forbidden",
    });
    if (!auth.ok) return auth.res;

    const { id } = await ctx.params;
    const job = await prisma.auditLogExportJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (job.requestedByUserId && job.requestedByUserId !== auth.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        fileName: job.fileName,
        mimeType: job.mimeType,
        error: job.error,
        rowsWritten: job.rowsWritten,
        attempts: job.attempts,
        leaseUntil: job.leaseUntil ? job.leaseUntil.toISOString() : null,
        filters: job.filters,
      },
    });
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withServerTiming("admin.audit_logs.exports.run", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.run.forbidden",
    });
    if (!auth.ok) return auth.res;

    // Extra protection for cron runners
    const cron = await verifyCronRequest(req);
    if (!cron.ok) {
      return NextResponse.json({ message: cron.message }, { status: cron.status });
    }

    const { id } = await ctx.params;
    const job = await prisma.auditLogExportJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Mark as pending if it was failed, to allow retry.
    if (job.status === "failed") {
      await prisma.auditLogExportJob.update({ where: { id }, data: { status: "pending", error: null } });
    }

    return NextResponse.json({ message: "Queued" });
  });
}
