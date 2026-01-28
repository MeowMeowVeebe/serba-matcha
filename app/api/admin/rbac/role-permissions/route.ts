import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { logAudit } from "@/lib/server/auditLog";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";

export async function PUT(req: Request) {
  const auth = await requirePermissionOr403(req, {
    permissionName: PERMISSIONS.ADMIN_ROLES_WRITE,
    auditAction: "admin.rbac.role_permissions.forbidden",
  });
  if (!auth.ok) return auth.res;

  let body: { roleId?: string; permissionIds?: string[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const roleId = (body.roleId ?? "").trim();
  const permissionIds = Array.isArray(body.permissionIds) ? body.permissionIds.map(String) : [];

  if (!roleId) return NextResponse.json({ message: "roleId wajib" }, { status: 400 });

  // Replace all permissions for the role (transaction)
  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }
  });

  await logAudit({
    action: "admin.rbac.role_permissions.updated",
    userId: auth.user.id,
    ip: auth.ip,
    meta: { roleId, permissionIds },
  });

  return NextResponse.json({ message: "OK" });
}
