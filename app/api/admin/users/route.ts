import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { logAudit } from "@/lib/server/auditLog";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";

import { withServerTiming } from "@/lib/server/observability";

export async function GET(req: Request) {
  return withServerTiming("admin.users", async () => {
  const auth = await requirePermissionOr403(req, {
    permissionName: PERMISSIONS.ADMIN_USERS_READ,
    auditAction: "admin.users.forbidden",
  });
  if (!auth.ok) return auth.res;

  const me = auth.user;
  const ip = auth.ip;

  const url = new URL(req.url);
  const qRaw = (url.searchParams.get("q") ?? "").trim();
  const q = qRaw.toLowerCase();

  const pageParam = Number(url.searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;

  const pageSizeParam = Number(url.searchParams.get("pageSize") ?? "20");
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(50, Math.max(10, Math.floor(pageSizeParam)))
      : 20;

  await logAudit({
    action: "admin.users.access",
    userId: me.id,
    ip,
    meta: { q: qRaw || undefined, page, pageSize },
  });

  const where = q
    ? {
        OR: [
          // mode: 'insensitive' supported by MySQL/Postgres; ignored/unsupported in SQLite.
          { email: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        roles: { select: { roleId: true, role: { select: { name: true } } } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

    return NextResponse.json({
      page,
      pageSize,
      total,
      q,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt.toISOString(),
        isAdmin: u.roles.some((r) => r.role.name === "admin"),
        roles: u.roles.map((r) => ({ id: r.roleId, name: r.role.name })),
      })),
    });
  });
}

