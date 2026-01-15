import { prisma } from "./prisma";
import { env } from "./env";

function parseSampleRate(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

function parseCleanupProb(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function parseRetentionDays(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function pickString(obj: Record<string, unknown>, key: string) {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function pickNumber(obj: Record<string, unknown>, key: string) {
  const v = obj[key];
  if (typeof v === "number" && Number.isFinite(v)) return Math.floor(v);
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.floor(n);
  }
  return null;
}

function buildMetaPreview(metaJson: string) {
  if (!metaJson) return null;
  const compact = metaJson.replace(/\s+/g, " ").trim();
  if (compact.length <= 200) return compact;
  return compact.slice(0, 200) + "…";
}

async function maybeCleanupOldAuditLogs() {
  const retentionDays = parseRetentionDays(env.AUDIT_RETENTION_DAYS);
  if (!retentionDays) return;

  const prob = parseCleanupProb(env.AUDIT_CLEANUP_PROB);
  if (prob <= 0) return;
  if (Math.random() > prob) return;

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  try {
    await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  } catch {
    // best-effort only
  }
}

/**
 * Best-effort audit log.
 * Supports sampling via AUDIT_SAMPLE_RATE to reduce write load on high-traffic routes.
 */
export async function logAudit(params: {
  action: string;
  userId?: string;
  ip?: string;
  meta?: Record<string, unknown>;
  /** Override sampling for specific events. Defaults to true. */
  sampled?: boolean;
}) {
  const shouldSample = params.sampled !== false;
  if (shouldSample) {
    const rate = parseSampleRate(env.AUDIT_SAMPLE_RATE);
    if (rate <= 0) return;
    if (rate < 1 && Math.random() > rate) return;
  }

  // best-effort cleanup (probabilistic)
  await maybeCleanupOldAuditLogs();

  const metaObj = params.meta ?? undefined;
  const metaJson = metaObj ? JSON.stringify(metaObj) : "";

  // Materialize common fields for faster search/filter.
  const targetUserId = metaObj ? pickString(metaObj, "targetUserId") ?? pickString(metaObj, "userId") : null;
  const targetEmail = metaObj ? pickString(metaObj, "targetEmail") ?? pickString(metaObj, "email") : null;
  const resource = metaObj ? pickString(metaObj, "resource") ?? pickString(metaObj, "path") ?? pickString(metaObj, "route") : null;
  const statusCode = metaObj ? pickNumber(metaObj, "statusCode") ?? pickNumber(metaObj, "status") : null;
  const metaPreview = metaJson ? buildMetaPreview(metaJson) : null;

  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId,
        ip: params.ip,
        targetUserId,
        targetEmail,
        resource,
        statusCode,
        meta: metaJson || undefined,
        metaPreview: metaPreview || undefined,
      },
    });
  } catch {
    // best-effort only
  }
}

export async function logAuditUnsampled(params: {
  action: string;
  userId?: string;
  ip?: string;
  meta?: Record<string, unknown>;
}) {
  return logAudit({ ...params, sampled: false });
}
