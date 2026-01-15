import { prisma } from "@/lib/server/prisma";
import { env } from "@/lib/server/env";

function parseRetentionDays(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

async function main() {
  const days = parseRetentionDays(env.AUDIT_RETENTION_DAYS);
  if (!days) {
    console.log("AUDIT_RETENTION_DAYS is 0/invalid; skipping cleanup.");
    return;
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const res = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  console.log(`Deleted ${res.count} audit logs older than ${days} days (cutoff=${cutoff.toISOString()}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
