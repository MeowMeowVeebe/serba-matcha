import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { PERMISSIONS } from "@/lib/server/permissions";
import { requirePermissionOr403 } from "@/lib/server/apiGuards";
import { withServerTiming } from "@/lib/server/observability";
import { logAudit } from "@/lib/server/auditLog";

export async function GET(req: Request) {
  return withServerTiming("admin.audit_logs.exports.list", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.list.forbidden",
    });
    if (!auth.ok) return auth.res;

    const url = new URL(req.url);
    const cursor = (url.searchParams.get("cursor") ?? "").trim();
    const take = Math.min(50, Math.max(5, Number(url.searchParams.get("take") ?? "20") || 20));

    const cursorWhere = cursor ? { createdAt: { lt: new Date(cursor) } } : undefined;

    const rows = await prisma.auditLogExportJob.findMany({
      where: {
        requestedByUserId: auth.user.id,
        ...(cursorWhere ? cursorWhere : {}),
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        fileName: true,
        mimeType: true,
        error: true,
        rowsWritten: true,
        filters: true,
      },
    });

    const hasMore = rows.length > take;
    const pageRows = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? pageRows[pageRows.length - 1].createdAt.toISOString() : null;

    return NextResponse.json({
      jobs: pageRows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      hasMore,
      nextCursor,
    });
  });
}

export async function POST(req: Request) {
  return withServerTiming("admin.audit_logs.exports.create", async () => {
    const auth = await requirePermissionOr403(req, {
      permissionName: PERMISSIONS.ADMIN_AUDIT_READ,
      auditAction: "admin.audit_logs.exports.create.forbidden",
    });
    if (!auth.ok) return auth.res;

    const body = (await req.json().catch(() => null)) as any;
    const rawFilters = body?.filters ?? {};

    // Guardrails: only allow known keys and limit payload size.
    const allowedKeys = new Set([
      "action",
      "userId",
      "targetUserId",
      "targetEmail",
      "resource",
      "statusCode",
      "q",
      "meta",
      "createdAtFrom",
      "createdAtTo",
    ]);

    const normalizeString = (v: unknown, maxLen: number) => {
      if (typeof v !== "string") return null;
      const s = v.trim();
      if (!s) return null;
      return s.length > maxLen ? s.slice(0, maxLen) : s;
    };

    const normalizeIsoDate = (v: unknown) => {
      const s = normalizeString(v, 40);
      if (!s) return null;
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString();
    };

    const normalizeBool = (v: unknown) => {
      if (typeof v === "boolean") return v;
      if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
      return false;
    };

    const normalizeIntString = (v: unknown) => {
      if (typeof v === "number" && Number.isFinite(v)) return String(Math.floor(v));
      if (typeof v === "string") {
        const s = v.trim();
        if (!s) return null;
        const n = Number(s);
        if (!Number.isFinite(n)) return null;
        return String(Math.floor(n));
      }
      return null;
    };

    const filters: Record<string, unknown> = {};
    if (rawFilters && typeof rawFilters === "object") {
      for (const [k, v] of Object.entries(rawFilters)) {
        if (!allowedKeys.has(k)) continue;
        switch (k) {
          case "action":
            filters[k] = normalizeString(v, 120);
            break;
          case "q":
            filters[k] = normalizeString(v, 200);
            break;
          case "targetUserId":
          case "userId":
            filters[k] = normalizeString(v, 80);
            break;
          case "targetEmail":
            filters[k] = normalizeString(v, 200);
            break;
          case "resource":
            filters[k] = normalizeString(v, 200);
            break;
          case "statusCode":
            filters[k] = normalizeIntString(v);
            break;
          case "meta":
            filters[k] = normalizeBool(v);
            break;
          case "createdAtFrom":
          case "createdAtTo":
            filters[k] = normalizeIsoDate(v);
            break;
          default:
            break;
        }
      }
    }

    // Remove null-ish values
    for (const k of Object.keys(filters)) {
      if (filters[k] == null || filters[k] === "") delete filters[k];
    }

    const filtersJson = JSON.stringify(filters);
    if (filtersJson.length > 2000) {
      return NextResponse.json({ message: "Filter terlalu besar." }, { status: 400 });
    }

    // Validate date range ordering and max span (90 days)
    const fromIso = typeof (filters as any).createdAtFrom === "string" ? ((filters as any).createdAtFrom as string) : "";
    const toIso = typeof (filters as any).createdAtTo === "string" ? ((filters as any).createdAtTo as string) : "";

    if (fromIso && toIso) {
      const from = new Date(fromIso);
      const to = new Date(toIso);
      if (from.getTime() > to.getTime()) {
        return NextResponse.json({ message: "createdAtFrom harus <= createdAtTo" }, { status: 400 });
      }
      const maxSpanMs = 90 * 24 * 60 * 60 * 1000;
      if (to.getTime() - from.getTime() > maxSpanMs) {
        return NextResponse.json({ message: "Rentang tanggal maksimal 90 hari" }, { status: 400 });
      }
    }

    // Guardrails: prevent unbounded heavy exports.
    const hasLimiter =
      Boolean(filters?.action) ||
      Boolean(filters?.createdAtFrom) ||
      Boolean(filters?.createdAtTo) ||
      Boolean(filters?.targetUserId) ||
      Boolean(filters?.targetEmail) ||
      Boolean(filters?.resource) ||
      Boolean(filters?.statusCode);

    if (!hasLimiter) {
      return NextResponse.json(
        { message: "Export terlalu luas. Sertakan minimal satu filter (action/tanggal/targetEmail/resource/statusCode)." },
        { status: 400 }
      );
    }

    if (filters?.meta) {
      // meta contains is expensive; require explicit date range.
      if (!filters?.createdAtFrom && !filters?.createdAtTo) {
        return NextResponse.json(
          { message: "Untuk export dengan meta search, wajib sertakan createdAtFrom atau createdAtTo." },
          { status: 400 }
        );
      }
    }

    const job = await prisma.auditLogExportJob.create({
      data: {
        requestedByUserId: auth.user.id,
        filters: filtersJson,
        status: "pending",
      },
      select: { id: true, status: true, createdAt: true },
    });

    await logAudit({
      action: "admin.audit_logs.exports.create",
      userId: auth.user.id,
      ip: auth.ip,
      meta: { jobId: job.id },
    });

    return NextResponse.json({ id: job.id, status: job.status, createdAt: job.createdAt.toISOString() });
  });
}
