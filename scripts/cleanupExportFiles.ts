import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/server/prisma";
import { env } from "@/lib/server/env";
import { resolveExportPath } from "@/lib/server/exportStorage";

function parseRetentionDays(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

async function safeUnlink(fullPath: string) {
  try {
    await fs.unlink(fullPath);
  } catch {
    // ignore
  }
}

async function main() {
  const days = parseRetentionDays(env.EXPORT_RETENTION_DAYS);
  if (!days) {
    console.log("EXPORT_RETENTION_DAYS is 0/invalid; skipping export cleanup.");
    return;
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Clean up old completed/failed jobs
  const oldJobs = await prisma.auditLogExportJob.findMany({
    where: {
      createdAt: { lt: cutoff },
      OR: [{ status: "completed" }, { status: "failed" }],
    },
    select: { id: true, filePath: true },
    take: 500,
  });

  let deletedFiles = 0;
  for (const j of oldJobs) {
    if (j.filePath) {
      const full = resolveExportPath(j.filePath);
      await safeUnlink(full);
      deletedFiles++;
    }
  }

  const deletedJobs = await prisma.auditLogExportJob.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      OR: [{ status: "completed" }, { status: "failed" }],
    },
  });

  // Reconcile: if a completed job points to a missing file, mark as failed.
  const completed = await prisma.auditLogExportJob.findMany({
    where: { status: "completed", filePath: { not: null } },
    select: { id: true, filePath: true },
    take: 200,
  });

  let missingFiles = 0;
  for (const j of completed) {
    try {
      await fs.stat(resolveExportPath(j.filePath!));
    } catch {
      missingFiles++;
      await prisma.auditLogExportJob.update({
        where: { id: j.id },
        data: { status: "failed", error: "Export file missing", filePath: null },
      });
    }
  }

  // Best-effort: remove orphan files under EXPORT_DIR/audit-logs (not referenced by any job)
  let orphanFilesDeleted = 0;
  try {
    const dir = path.join(env.EXPORT_DIR, "audit-logs");
    const names = await fs.readdir(dir);
    const referenced = new Set(
      (
        await prisma.auditLogExportJob.findMany({
          where: { filePath: { not: null } },
          select: { filePath: true },
        })
      )
        .map((r) => r.filePath!)
        .filter(Boolean)
        .map((p) => p.replace(/\\/g, "/"))
    );

    for (const name of names) {
      const rel = `audit-logs/${name}`;
      if (!referenced.has(rel)) {
        await safeUnlink(resolveExportPath(rel));
        orphanFilesDeleted++;
      }
    }
  } catch {
    // ignore
  }

  console.log(
    `Export cleanup done. deletedJobs=${deletedJobs.count}, deletedFiles=${deletedFiles}, missingFilesMarkedFailed=${missingFiles}, orphanFilesDeleted=${orphanFilesDeleted}, cutoff=${cutoff.toISOString()}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
