import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { resolveExportPath } from "@/lib/server/exportStorage";
import fs from "node:fs";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";
import { logAudit } from "@/lib/server/auditLog";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withServerTiming("admin.audit_logs.exports.download", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.download.forbidden",
    });
    if (!auth.ok) return auth.res;

    const { id } = await ctx.params;
    const job = await prisma.auditLogExportJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (job.requestedByUserId && job.requestedByUserId !== auth.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Support legacy DB storage and new filesystem storage
    if (job.status !== "completed") {
      return NextResponse.json({ message: "Not ready" }, { status: 409 });
    }

    if (job.filePath) {
      await logAudit({
        action: "admin.audit_logs.exports.download",
        userId: auth.user.id,
        ip: auth.ip,
        meta: { jobId: job.id },
      });

      const fullPath = resolveExportPath(job.filePath);
      const stream = fs.createReadStream(fullPath);

      return new NextResponse(stream as any, {
        status: 200,
        headers: {
          "Content-Type": job.mimeType ?? "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${job.fileName ?? `audit-logs-${job.id}.csv`}\"`,
          "Cache-Control": "private, max-age=0, no-store",
        },
      });
    }

    // Legacy fallback
    if (job.csvBase64) {
      const bytes = Buffer.from(job.csvBase64, "base64");
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          "Content-Type": job.mimeType ?? "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=\"${job.fileName ?? `audit-logs-${job.id}.csv`}\"`,
          "Cache-Control": "private, max-age=0, no-store",
        },
      });
    }

    return NextResponse.json({ message: "Not ready" }, { status: 409 });
  });
}
