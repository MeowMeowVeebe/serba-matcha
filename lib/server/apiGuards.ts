import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "./authSession";
import { findUserById } from "./userStore";
import { logAudit } from "./auditLog";
import { getClientIp } from "./rateLimit";
import { ensureDefaultAdminPermissions } from "./rbacBootstrap";
import { requirePermission } from "./rbac";
import { bootstrapAdminIfNeeded } from "./bootstrapAdmin";

export async function requireAuthUser(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) return { ok: false as const, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };

  const user = await findUserById(session.sub);
  if (!user) return { ok: false as const, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };

  return { ok: true as const, user };
}

export async function requirePermissionOr403(req: Request, opts: { permissionName: string; auditAction: string }) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return auth;

  const ip = getClientIp(req);

  // One-time bootstrap: create/assign first admin from env if no admin exists yet.
  await bootstrapAdminIfNeeded();

  await ensureDefaultAdminPermissions();
  const ok = await requirePermission({ userId: auth.user.id, permissionName: opts.permissionName });
  if (!ok) {
    await logAudit({ action: opts.auditAction, userId: auth.user.id, ip });
    return { ok: false as const, res: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, user: auth.user, ip };
}
