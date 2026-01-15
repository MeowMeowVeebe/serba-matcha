import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/server/auditLog";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";

import { withServerTiming } from "@/lib/server/observability";

export async function GET(req: Request) {
  return withServerTiming("admin.audit_logs", async () => {
  const auth = await requirePermissionOr403(req, {
    permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
    auditAction: "admin.audit_logs.forbidden",
  });
  if (!auth.ok) return auth.res;

  const me = auth.user;
  const ip = auth.ip;

  const url = new URL(req.url);
  const action = (url.searchParams.get("action") ?? "").trim();
  const userId = (url.searchParams.get("userId") ?? "").trim();
  const q = (url.searchParams.get("q") ?? "").trim();
  const metaSearch = (url.searchParams.get("meta") ?? "0").trim() === "1";
  const includeMeta = (url.searchParams.get("includeMeta") ?? "0").trim() === "1";

  // SQLite-friendly: if metaSearch is enabled without explicit date range, apply a default recent window.
  const defaultMetaWindowDays = Number(process.env.META_SEARCH_DEFAULT_DAYS ?? "7") || 7;

  // Advanced filters (materialized fields)
  const targetUserId = (url.searchParams.get("targetUserId") ?? "").trim();
  const targetEmail = (url.searchParams.get("targetEmail") ?? "").trim();
  const resource = (url.searchParams.get("resource") ?? "").trim();
  const statusCodeRaw = (url.searchParams.get("statusCode") ?? "").trim();

  // Date range filters
  const createdAtFromRaw = (url.searchParams.get("createdAtFrom") ?? "").trim();
  const createdAtToRaw = (url.searchParams.get("createdAtTo") ?? "").trim();

  const pageSize = Math.min(50, Math.max(10, Number(url.searchParams.get("pageSize") ?? "20") || 20));

  // Cursor pagination
  // cursor format: `${createdAtISO}|${id}` (URL-encoded)
  const cursorRaw = (url.searchParams.get("cursor") ?? "").trim();
  const direction = (url.searchParams.get("dir") ?? "next").trim(); // next|prev

  const where: Prisma.AuditLogWhereInput = {};
  if (action) where.action = { contains: action };
  if (userId) where.userId = userId;
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

  // Apply implicit date window when doing meta search without user-provided range.
  if (metaSearch && !createdAtFromRaw && !createdAtToRaw) {
    const cutoff = new Date(Date.now() - defaultMetaWindowDays * 24 * 60 * 60 * 1000);
    where.createdAt = { ...(where.createdAt as any), gte: cutoff };
  }

  // Search optimization:
  // - by default search only `action` and `ip`
  // - include `meta` only if meta=1 to avoid heavy scans
  if (q) {
    where.OR = metaSearch
      ? [{ meta: { contains: q } }, { ip: { contains: q } }, { action: { contains: q } }]
      : [{ ip: { contains: q } }, { action: { contains: q } }];
  }

  // Build cursor filter.
  let cursorCreatedAt: Date | null = null;
  let cursorId: string | null = null;
  if (cursorRaw) {
    const [createdAtIso, id] = cursorRaw.split("|");
    if (createdAtIso && id) {
      const d = new Date(createdAtIso);
      if (!Number.isNaN(d.getTime())) {
        cursorCreatedAt = d;
        cursorId = id;
      }
    }
  }

  const isPrev = direction === "prev";
  const orderBy: Prisma.AuditLogOrderByWithRelationInput[] = isPrev
    ? [{ createdAt: "asc" }, { id: "asc" }]
    : [{ createdAt: "desc" }, { id: "desc" }];

  const cursorWhere: Prisma.AuditLogWhereInput | null =
    cursorCreatedAt && cursorId
      ? isPrev
        ? {
            OR: [
              { createdAt: { gt: cursorCreatedAt } },
              { createdAt: cursorCreatedAt, id: { gt: cursorId } },
            ],
          }
        : {
            OR: [
              { createdAt: { lt: cursorCreatedAt } },
              { createdAt: cursorCreatedAt, id: { lt: cursorId } },
            ],
          }
      : null;

  const finalWhere: Prisma.AuditLogWhereInput = cursorWhere ? { AND: [where, cursorWhere] } : where;

  // For cursor pagination we return a window and provide cursors.
  // Total is expensive; we keep it only when explicitly asked.
  const includeTotal = (url.searchParams.get("total") ?? "0").trim() === "1";

  const [total, rows] = await Promise.all([
    includeTotal ? prisma.auditLog.count({ where }) : Promise.resolve(null),
    prisma.auditLog.findMany({
      where: finalWhere,
      orderBy,
      select: {
        id: true,
        action: true,
        userId: true,
        ip: true,
        metaPreview: true,
        meta: includeMeta,
        createdAt: true,
      },
      take: pageSize + 1, // fetch one extra to determine hasMore
    }),
  ]);

  const hasMore = rows.length > pageSize;
  const windowRows = hasMore ? rows.slice(0, pageSize) : rows;

  // When direction=prev we queried ascending; return in standard (desc) order.
  const normalized = isPrev ? windowRows.slice().reverse() : windowRows;

  const nextCursor =
    normalized.length > 0
      ? `${normalized[normalized.length - 1].createdAt.toISOString()}|${normalized[normalized.length - 1].id}`
      : null;
  const prevCursor = normalized.length > 0 ? `${normalized[0].createdAt.toISOString()}|${normalized[0].id}` : null;

  // High-traffic access logs are sampled to reduce DB writes.
  await logAudit({
    action: "admin.audit_logs.access",
    userId: me.id,
    ip,
    meta: { pageSize, q: q ? true : false, metaSearch, direction: isPrev ? "prev" : "next" },
  });

  return NextResponse.json({
    pageSize,
    action,
    userId,
    targetUserId,
    targetEmail,
    resource,
    statusCode: statusCodeRaw || "",
    createdAtFrom: createdAtFromRaw || "",
    createdAtTo: createdAtToRaw || "",
    q,
    metaSearch,
    total,
    hasMore,
    nextCursor,
    prevCursor,
    includeMeta,
    logs: normalized.map((r) => ({
      id: r.id,
      action: r.action,
      userId: r.userId,
      ip: r.ip,
      metaPreview: (r as any).metaPreview ?? null,
      meta: includeMeta ? (r as any).meta ?? null : null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
  });
}

