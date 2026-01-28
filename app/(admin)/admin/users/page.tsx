import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import { getSessionPayloadFromNextCookies } from "@/lib/server/nextAuthSession";
import { findUserById } from "@/lib/server/userStore";
import { ensureDefaultAdminPermissions } from "@/lib/server/rbacBootstrap";
import { bootstrapAdminIfNeeded } from "@/lib/server/bootstrapAdmin";
import { requirePermission } from "@/lib/server/rbac";
import { PERMISSIONS } from "@/lib/server/permissions";
import UsersClient, { type AdminUsersInitialData } from "./UsersClient";

const DEFAULT_PAGE_SIZE = 20;

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 0) return fallback;
  return Math.floor(n);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string };
}) {
  const session = await getSessionPayloadFromNextCookies();
  if (!session) redirect("admin_dashboard/login");

  const me = await findUserById(session.sub);
  if (!me) redirect("admin_dashboard/login");

  await bootstrapAdminIfNeeded();
  await ensureDefaultAdminPermissions();

  const ok = await requirePermission({ userId: me.id, permissionName: PERMISSIONS.ADMIN_USERS_READ });
  if (!ok) {
    // Keep behavior consistent with client pages: show message after hydration.
    // But for server render, simplest is redirect to /dashboard.
    redirect("admin_dashboard/dashboard");
  }

  const qRaw = (searchParams?.q ?? "").trim();
  const qLower = qRaw.toLowerCase();
  const page = parsePositiveInt(searchParams?.page ?? null, 1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const where = qLower
    ? {
        OR: [
          { email: { contains: qLower, mode: "insensitive" as const } },
          { name: { contains: qLower, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, users, roles] = await Promise.all([
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
    prisma.role.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const initial: AdminUsersInitialData = {
    query: { q: qRaw, page },
    pageSize,
    total,
    rows: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt.toISOString(),
      isAdmin: u.roles.some((r) => r.role.name === "admin"),
      roles: u.roles.map((r) => ({ id: r.roleId, name: r.role.name })),
    })),
    roles,
  };

  return <UsersClient initial={initial} />;
}

// (Client implementation moved to UsersClient.tsx)
