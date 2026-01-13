import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { prisma } from "@/lib/server/prisma";
import { findUserById } from "@/lib/server/userStore";
import { logAudit } from "@/lib/server/auditLog";
import { getClientIp } from "@/lib/server/rateLimit";
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

  // RBAC: admin role.
  // Bootstrap fallback: kalau email ada di ADMIN_EMAILS, auto-assign role admin (sekali) biar mudah setup.
  const admins = parseAdminEmails();
  if (admins.includes(me.email.toLowerCase())) {
    await assignRoleToUser({ userId: me.id, roleName: "admin" });
  }

  const ok = await isAdmin(me.id);
  if (!ok) {
    await logAudit({ action: "admin.users.forbidden", userId: me.id, ip });
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

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
        roles: { select: { role: { select: { name: true } } } },
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
    })),
  });
}
