import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withServerTiming("admin.audit_logs.detail", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.detail.forbidden",
    });
    if (!auth.ok) return auth.res;

    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const row = await prisma.auditLog.findUnique({
      where: { id },
      select: {
        id: true,
        action: true,
        userId: true,
        ip: true,
        meta: true,
        metaPreview: true,
        targetUserId: true,
        targetEmail: true,
        resource: true,
        statusCode: true,
        createdAt: true,
      },
    });

    if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({
      log: {
        ...row,
        createdAt: row.createdAt.toISOString(),
      },
    });
  });
}
