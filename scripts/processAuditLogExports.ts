import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@prisma/client";
import { env } from "@/lib/server/env";
import { ensureExportDir, resolveExportPath } from "@/lib/server/exportStorage";
import fs from "node:fs";
import path from "node:path";

type Filters = {
  action?: string;
  userId?: string;
  targetUserId?: string;
  targetEmail?: string;
  resource?: string;
  statusCode?: string;
  q?: string;
  meta?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
};

function escapeCsvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildWhere(filters: Filters) {
  const where: any = {};
  if (filters.action) where.action = { contains: filters.action };
  if (filters.userId) where.userId = filters.userId;
  if (filters.targetUserId) where.targetUserId = filters.targetUserId;
  if (filters.targetEmail) where.targetEmail = { contains: filters.targetEmail, mode: "insensitive" };
  if (filters.resource) where.resource = { contains: filters.resource, mode: "insensitive" };
  if (filters.statusCode) {
    const n = Number(filters.statusCode);
    if (Number.isFinite(n)) where.statusCode = Math.floor(n);
  }

  if (filters.createdAtFrom) {
    const d = new Date(filters.createdAtFrom);
    if (!Number.isNaN(d.getTime())) where.createdAt = { ...(where.createdAt as any), gte: d };
  }
  if (filters.createdAtTo) {
    const d = new Date(filters.createdAtTo);
    if (!Number.isNaN(d.getTime())) where.createdAt = { ...(where.createdAt as any), lte: d };
  }

  const q = (filters.q ?? "").trim();
  if (q) {
    where.OR = filters.meta
      ? [{ meta: { contains: q } }, { ip: { contains: q } }, { action: { contains: q } }]
      : [{ ip: { contains: q } }, { action: { contains: q } }];
  }
  return where;
}

function parsePositiveInt(v: string, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 0) return fallback;
  return Math.floor(n);
}

async function processOne(jobId: string) {
  const job = await prisma.auditLogExportJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  if (job.status !== "pending") return;

  // Acquire lease (best-effort optimistic update)
  const leaseUntil = new Date(Date.now() + 2 * 60 * 1000);
  const claimed = await prisma.auditLogExportJob.updateMany({
    where: {
      id: jobId,
      status: "pending",
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
    },
    data: {
      status: "running",
      leaseUntil,
      attempts: { increment: 1 },
      error: null,
    },
  });

  if (claimed.count !== 1) return;

  let written = 0;

  try {
    const filters = JSON.parse(job.filters) as Filters;
    const where = buildWhere(filters);

    const maxRows = parsePositiveInt(env.EXPORT_MAX_ROWS, 100000);
    const pageSize = Math.min(5000, parsePositiveInt(env.EXPORT_PAGE_SIZE, 1000));

    const fileName = `audit-logs-${jobId}.csv`;
    const relPath = `audit-logs/${fileName}`;

    await ensureExportDir();
    const fullPath = resolveExportPath(relPath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

    const out = fs.createWriteStream(fullPath, { encoding: "utf8" });

    const cancelAndCleanup = async () => {
      try {
        out.destroy();
      } catch {
        // ignore
      }
      try {
        await fs.promises.unlink(fullPath);
      } catch {
        // ignore
      }

      await prisma.auditLogExportJob.update({
        where: { id: jobId },
        data: {
          status: "cancelled",
          leaseUntil: null,
          filePath: null,
          fileName: null,
          mimeType: null,
          error: "Cancelled by user",
        },
      });
    };

    const header = [
      "id",
      "createdAt",
      "action",
      "userId",
      "ip",
      "targetUserId",
      "targetEmail",
      "resource",
      "statusCode",
      "meta",
    ].join(",");

    out.write(header + "\n");

    written = 0;

    // reset progress
    await prisma.auditLogExportJob.update({ where: { id: jobId }, data: { rowsWritten: 0 } });
    let cursorCreatedAt: Date | null = null;
    let cursorId: string | null = null;

    while (written < maxRows) {
      const take = Math.min(pageSize, maxRows - written);

      const cursorWhere: Prisma.AuditLogWhereInput | null =
        cursorCreatedAt && cursorId
          ? {
              OR: [
                { createdAt: { lt: cursorCreatedAt } },
                { createdAt: cursorCreatedAt, id: { lt: cursorId } },
              ],
            }
          : null;

      const finalWhere: Prisma.AuditLogWhereInput = cursorWhere ? { AND: [where, cursorWhere] } : where;

      const rows = await prisma.auditLog.findMany({
        where: finalWhere,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          createdAt: true,
          action: true,
          userId: true,
          ip: true,
          targetUserId: true,
          targetEmail: true,
          resource: true,
          statusCode: true,
          meta: true,
          metaPreview: true,
        },
        take: take,
      });

      if (rows.length === 0) break;

      for (const r of rows) {
        const line = [
          r.id,
          r.createdAt.toISOString(),
          r.action,
          r.userId ?? "",
          r.ip ?? "",
          r.targetUserId ?? "",
          r.targetEmail ?? "",
          r.resource ?? "",
          r.statusCode ?? "",
          r.meta ?? r.metaPreview ?? "",
        ]
          .map(escapeCsvCell)
          .join(",");

        out.write(line + "\n");
        written++;

        if (written % 250 === 0) {
          // progress heartbeat
          await prisma.auditLogExportJob.update({ where: { id: jobId }, data: { rowsWritten: written } });

          // check cancellation
          const st = await prisma.auditLogExportJob.findUnique({
            where: { id: jobId },
            select: { status: true },
          });
          if (st?.status === "cancelled") {
            await cancelAndCleanup();
            return;
          }
        }
      }

      cursorCreatedAt = rows[rows.length - 1].createdAt;
      cursorId = rows[rows.length - 1].id;

      // check cancellation once per page as well
      const stPage = await prisma.auditLogExportJob.findUnique({ where: { id: jobId }, select: { status: true } });
      if (stPage?.status === "cancelled") {
        await cancelAndCleanup();
        return;
      }

      if (rows.length < take) break;
    }

    await new Promise<void>((resolve, reject) => {
      out.end(() => resolve());
      out.on("error", reject);
    });

    const filePath = relPath;

    await prisma.auditLogExportJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        leaseUntil: null,
        rowsWritten: written,
        fileName,
        mimeType: "text/csv; charset=utf-8",
        filePath,
        // keep legacy field null
        csvBase64: null,
      },
    });
  } catch (e: any) {
    await prisma.auditLogExportJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        leaseUntil: null,
        rowsWritten: written,
        error: e?.message ? String(e.message) : "Export failed",
      },
    });
  }
}

async function requeueStuckJobs() {
  // If a job is running but lease expired, mark it pending again.
  await prisma.auditLogExportJob.updateMany({
    where: { status: "running", leaseUntil: { lt: new Date() } },
    data: { status: "pending", leaseUntil: null },
  });
}

async function main() {
  await requeueStuckJobs();

  const jobs = await prisma.auditLogExportJob.findMany({
    where: {
      status: "pending",
      // stop retrying forever
      attempts: { lt: 5 },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: { id: true },
  });

  if (jobs.length === 0) {
    console.log("No pending export jobs.");
    return;
  }

  for (const j of jobs) {
    console.log(`Processing job ${j.id}...`);
    await processOne(j.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
