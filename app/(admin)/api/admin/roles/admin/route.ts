import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/server/rateLimit";
import { logAudit } from "@/lib/server/auditLog";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { assignRoleToUser } from "@/lib/server/rbac";
import { prisma } from "@/lib/server/prisma";

async function ensureRequesterIsAdmin(req: Request) {
  const auth = await requirePermissionOr403(req, {
    permissionName: PERMISSIONS.ADMIN_ROLES_WRITE,
    auditAction: "admin.roles.forbidden",
  });
  if (!auth.ok) return { ok: false as const, status: auth.res.status };

  return { ok: true as const, me: auth.user };
}

export async function POST(req: Request) {
  const auth = await ensureRequesterIsAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status });
  }

  const ip = getClientIp(req);

  let body: { userId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const userId = (body.userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ message: "userId wajib diisi" }, { status: 400 });
  }

  await assignRoleToUser({ userId, roleName: "admin" });
  await logAudit({ action: "admin.roles.assign", userId: auth.me.id, ip, meta: { targetUserId: userId, role: "admin" } });

  return NextResponse.json({ message: "OK" });
}

export async function DELETE(req: Request) {
  const auth = await ensureRequesterIsAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.status === 401 ? "Unauthorized" : "Forbidden" }, { status: auth.status });
  }

  const ip = getClientIp(req);
  const url = new URL(req.url);
  const userId = (url.searchParams.get("userId") ?? "").trim();

  if (!userId) {
    return NextResponse.json({ message: "userId wajib diisi" }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { name: "admin" } });
  if (role) {
    await prisma.userRole.deleteMany({ where: { userId, roleId: role.id } });
  }

  await logAudit({ action: "admin.roles.revoke", userId: auth.me.id, ip, meta: { targetUserId: userId, role: "admin" } });

  return NextResponse.json({ message: "OK" });
}
