import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { logAudit } from "@/lib/server/auditLog";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { ensureDefaultAdminPermissions } from "@/lib/server/rbacBootstrap";

import { withServerTiming } from "@/lib/server/observability";
import { computeJsonEtag, isEtagMatch } from "@/lib/server/etag";

export async function GET(req: Request) {
  return withServerTiming("admin.rbac.permissions", async () => {
  const auth = await requirePermissionOr403(req, {
    permissionName: PERMISSIONS.ADMIN_ROLES_WRITE,
    auditAction: "admin.rbac.permissions.forbidden",
  });
  if (!auth.ok) return auth.res;

  // ensure base perms exist
  await ensureDefaultAdminPermissions();

  await logAudit({ action: "admin.rbac.permissions.access", userId: auth.user.id, ip: auth.ip });

  const perms = await prisma.permission.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

    const payload = { permissions: perms };
    const etag = computeJsonEtag(payload);

    if (isEtagMatch(req.headers.get("if-none-match"), etag)) {
      const res = new NextResponse(null, { status: 304 });
      res.headers.set("ETag", etag);
      res.headers.set("Cache-Control", "private, max-age=60");
      return res;
    }

    const res = NextResponse.json(payload);
    res.headers.set("ETag", etag);
    // permissions change rarely; allow short caching
    res.headers.set("Cache-Control", "private, max-age=60");
    return res;
  });
}
