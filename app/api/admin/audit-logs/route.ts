import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@prisma/client";
import { findUserById } from "@/lib/server/userStore";
import { getClientIp } from "@/lib/server/rateLimit";
import { logAudit } from "@/lib/server/auditLog";
import { assignRoleToUser, isAdmin } from "@/lib/server/rbac";

function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const me = await findUserById(session.sub);
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);

  // bootstrap admin from env (consistent with /admin/users)
  const admins = parseAdminEmails();
  if (admins.includes(me.email.toLowerCase())) {
    await assignRoleToUser({ userId: me.id, roleName: "admin" });
  }

  const ok = await isAdmin(me.id);
  if (!ok) {
    await logAudit({ action: "admin.audit_logs.forbidden", userId: me.id, ip });
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const action = (url.searchParams.get("action") ?? "").trim();
  const userId = (url.searchParams.get("userId") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();

  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(10, Number(url.searchParams.get("pageSize") ?? "20") || 20));

  const where: Prisma.AuditLogWhereInput = {};
  if (action) where.action = { contains: action };
  if (userId) where.userId = userId;
  if (q) {
    where.OR = [
      { meta: { contains: q } },
      { ip: { contains: q } },
      { action: { contains: q } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true, userId: true, ip: true, meta: true, createdAt: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  await logAudit({ action: "admin.audit_logs.access", userId: me.id, ip, meta: { page, pageSize } });

  return NextResponse.json({
    page,
    pageSize,
    total,
    action,
    userId,
    q,
    logs: rows.map((r) => ({
      id: r.id,
      action: r.action,
      userId: r.userId,
      ip: r.ip,
      meta: r.meta,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
