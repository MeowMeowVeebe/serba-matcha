import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
import { getSessionPayloadFromNextCookies } from "@/lib/server/nextAuthSession";
import { findUserById } from "@/lib/server/userStore";
import { ensureDefaultAdminPermissions } from "@/lib/server/rbacBootstrap";
import { bootstrapAdminIfNeeded } from "@/lib/server/bootstrapAdmin";
import { requirePermission } from "@/lib/server/rbac";
import { PERMISSIONS } from "@/lib/server/permissions";
import AuditLogsClientNew from "./AuditLogsClientNew";
// Original complex client temporarily disabled due to JSX syntax errors
// import AuditLogsClient, { type AdminAuditInitialData } from "./AuditLogsClient";

type AdminAuditInitialData = {
  query: {
    action: string;
    q: string;
    meta: boolean;
    targetUserId: string;
    targetEmail: string;
    resource: string;
    statusCode: string;
    createdAtFrom: string;
    createdAtTo: string;
    cursor: string;
    dir: string;
  };
  pageSize: number;
  total: number | null;
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
  rows: Array<{
    id: string;
    action: string;
    userId: string | null;
    ip: string | null;
    metaPreview: string | null;
    meta: string | null;
    createdAt: string;
  }>;
};

const DEFAULT_PAGE_SIZE = 20;

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 0) return fallback;
  return Math.floor(n);
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams?: {
    action?: string;
    q?: string;
    meta?: string;
    cursor?: string;
    dir?: string;
    targetUserId?: string;
    targetEmail?: string;
    resource?: string;
    statusCode?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
  };
}) {
  const session = await getSessionPayloadFromNextCookies();
  if (!session) redirect("/login");

  const me = await findUserById(session.sub);
  if (!me) redirect("/login");

  await bootstrapAdminIfNeeded();
  await ensureDefaultAdminPermissions();

  const ok = await requirePermission({ userId: me.id, permissionName: PERMISSIONS.ADMIN_AUDIT_READ });
  if (!ok) redirect("/dashboard");

  const action = (searchParams?.action ?? "").trim();
  const q = (searchParams?.q ?? "").trim();
  const meta = (searchParams?.meta ?? "0") === "1";
  const cursor = (searchParams?.cursor ?? "").trim();
  const dir = (searchParams?.dir ?? "next") === "prev" ? "prev" : "next";

  const targetUserId = (searchParams?.targetUserId ?? "").trim();
  const targetEmail = (searchParams?.targetEmail ?? "").trim();
  const resource = (searchParams?.resource ?? "").trim();
  const statusCodeRaw = (searchParams?.statusCode ?? "").trim();
  const createdAtFromRaw = (searchParams?.createdAtFrom ?? "").trim();
  const createdAtToRaw = (searchParams?.createdAtTo ?? "").trim();

  const pageSize = DEFAULT_PAGE_SIZE;

  // Mirror API search optimization: meta is optional.
  const where: any = {};
  if (action) where.action = { contains: action };
  if (targetUserId) where.targetUserId = targetUserId;
  if (targetEmail) where.targetEmail = { contains: targetEmail, mode: "insensitive" };
  if (resource) where.resource = { contains: resource, mode: "insensitive" };
  if (statusCodeRaw) {
    const n = Number(statusCodeRaw);
    if (Number.isFinite(n)) where.statusCode = Math.floor(n);
  }
  if (createdAtFromRaw) {
    const d = new Date(createdAtFromRaw);
    if (!Number.isNaN(d.getTime())) where.createdAt = { ...(where.createdAt as any), gte: d };
  }
  if (createdAtToRaw) {
    const d = new Date(createdAtToRaw);
    if (!Number.isNaN(d.getTime())) where.createdAt = { ...(where.createdAt as any), lte: d };
  }

  if (q) {
    where.OR = meta
      ? [{ meta: { contains: q } }, { ip: { contains: q } }, { action: { contains: q } }]
      : [{ ip: { contains: q } }, { action: { contains: q } }];
  }

  // Server page uses the same cursor logic as API, for fast initial render.
  let cursorCreatedAt: Date | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    const [createdAtIso, id] = cursor.split("|");
    if (createdAtIso && id) {
      const d = new Date(createdAtIso);
      if (!Number.isNaN(d.getTime())) {
        cursorCreatedAt = d;
        cursorId = id;
      }
    }
  }

  const isPrev = dir === "prev";
  const orderBy = isPrev ? [{ createdAt: "asc" as const }, { id: "asc" as const }] : [{ createdAt: "desc" as const }, { id: "desc" as const }];

  const cursorWhere =
    cursorCreatedAt && cursorId
      ? isPrev
        ? {
            OR: [{ createdAt: { gt: cursorCreatedAt } }, { createdAt: cursorCreatedAt, id: { gt: cursorId } }],
          }
        : {
            OR: [{ createdAt: { lt: cursorCreatedAt } }, { createdAt: cursorCreatedAt, id: { lt: cursorId } }],
          }
      : null;

  const finalWhere = cursorWhere ? { AND: [where, cursorWhere] } : where;

  const [total, rows] = await Promise.all([
    // Only compute total for first load (no cursor)
    cursor ? Promise.resolve(null) : prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where: finalWhere,
      orderBy,
      select: { id: true, action: true, userId: true, ip: true, metaPreview: true, meta: false, createdAt: true },
      take: pageSize + 1,
    }),
  ]);

  const hasMore = rows.length > pageSize;
  const windowRows = hasMore ? rows.slice(0, pageSize) : rows;
  const normalized = isPrev ? windowRows.slice().reverse() : windowRows;

  const nextCursor =
    normalized.length > 0
      ? `${normalized[normalized.length - 1].createdAt.toISOString()}|${normalized[normalized.length - 1].id}`
      : null;
  const prevCursor = normalized.length > 0 ? `${normalized[0].createdAt.toISOString()}|${normalized[0].id}` : null;

  const initial: AdminAuditInitialData = {
    query: {
      action,
      q,
      meta,
      targetUserId,
      targetEmail,
      resource,
      statusCode: statusCodeRaw,
      createdAtFrom: createdAtFromRaw,
      createdAtTo: createdAtToRaw,
      cursor,
      dir,
    },
    pageSize,
    total,
    hasMore,
    nextCursor,
    prevCursor,
    rows: normalized.map((r) => ({
      id: r.id,
      action: r.action,
      userId: r.userId,
      ip: r.ip,
      metaPreview: (r as any).metaPreview ?? null,
      meta: null,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  // Using simpler client while original is being fixed
  return <AuditLogsClientNew />;
}

// (Client implementation moved to AuditLogsClient.tsx)
