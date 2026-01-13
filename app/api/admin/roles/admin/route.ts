import { NextResponse } from "next/server";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
import { findUserById } from "@/lib/server/userStore";
import { getClientIp } from "@/lib/server/rateLimit";
import { logAudit } from "@/lib/server/auditLog";
import { assignRoleToUser, isAdmin } from "@/lib/server/rbac";
import { prisma } from "@/lib/server/prisma";

function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function ensureRequesterIsAdmin(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) return { ok: false as const, status: 401 };

  const me = await findUserById(session.sub);
  if (!me) return { ok: false as const, status: 401 };

  const admins = parseAdminEmails();
  if (admins.includes(me.email.toLowerCase())) {
    await assignRoleToUser({ userId: me.id, roleName: "admin" });
  }

  const ok = await isAdmin(me.id);
  if (!ok) return { ok: false as const, status: 403 };

  return { ok: true as const, me };
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
