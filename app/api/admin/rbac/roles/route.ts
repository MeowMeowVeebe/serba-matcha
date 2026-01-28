import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { logAudit } from "@/lib/server/auditLog";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";

import { withServerTiming } from "@/lib/server/observability";
import { computeJsonEtag, isEtagMatch } from "@/lib/server/etag";

export async function GET(req: Request) {
  return withServerTiming("admin.rbac.roles", async () => {
  const auth = await requirePermissionOr403(req, {
    permissionName: PERMISSIONS.ADMIN_ROLES_WRITE,
    auditAction: "admin.rbac.roles.forbidden",
  });
  if (!auth.ok) return auth.res;

  await logAudit({ action: "admin.rbac.roles.access", userId: auth.user.id, ip: auth.ip });

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      permissions: {
        select: {
          permission: { select: { id: true, name: true } },
        },
      },
    },
  });

    const payload = {
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        permissions: r.permissions.map((rp) => rp.permission),
      })),
    };
    const etag = computeJsonEtag(payload);

    if (isEtagMatch(req.headers.get("if-none-match"), etag)) {
      const res = new NextResponse(null, { status: 304 });
      res.headers.set("ETag", etag);
      res.headers.set("Cache-Control", "private, max-age=30");
      return res;
    }

    const res = NextResponse.json(payload);
    res.headers.set("ETag", etag);
    // roles change rarely; allow short CDN/client caching
    res.headers.set("Cache-Control", "private, max-age=30");
    return res;
  });
}

export async function POST(req: Request) {
  const auth = await requirePermissionOr403(req, {
    permissionName: PERMISSIONS.ADMIN_ROLES_WRITE,
    auditAction: "admin.rbac.roles.forbidden",
  });
  if (!auth.ok) return auth.res;

  let body: { name?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const name = (body.name ?? "").trim().toLowerCase();
  if (!name) return NextResponse.json({ message: "name wajib" }, { status: 400 });

  const role = await prisma.role.upsert({
    where: { name },
    create: { name },
    update: {},
    select: { id: true, name: true },
  });

  await logAudit({ action: "admin.rbac.roles.upsert", userId: auth.user.id, ip: auth.ip, meta: { role } });

  return NextResponse.json({ role });
}
