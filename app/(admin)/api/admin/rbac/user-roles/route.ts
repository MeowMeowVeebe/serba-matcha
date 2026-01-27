import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { logAudit } from "@/lib/server/auditLog";

export async function PUT(req: Request) {
  const auth = await requirePermissionOr403(req, {
    permissionName: PERMISSIONS.ADMIN_ROLES_WRITE,
    auditAction: "admin.rbac.user_roles.forbidden",
  });
  if (!auth.ok) return auth.res;

  let body: { userId?: string; roleIds?: string[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const userId = (body.userId ?? "").trim();
  const roleIds = Array.isArray(body.roleIds) ? body.roleIds.map(String) : [];
  if (!userId) return NextResponse.json({ message: "userId wajib" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId } });
    if (roleIds.length) {
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
      });
    }
  });

  await logAudit({
    action: "admin.rbac.user_roles.updated",
    userId: auth.user.id,
    ip: auth.ip,
    meta: { targetUserId: userId, roleIds },
  });

  return NextResponse.json({ message: "OK" });
}
