function required(name: string): string {
  const v = process.env[name];
  if (v && v.trim()) return v.trim();

  // During `next build`, Next may evaluate server modules to collect route data.
  // We avoid throwing here so builds can succeed in environments where runtime
  // secrets are injected later (e.g. deployment platform).
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "";
  }

  throw new Error(`Missing required env: ${name}`);
}

function optional(name: string, fallback = ""): string {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : fallback;
}

function requiredOneOf(names: string[]): string {
  for (const name of names) {
    const v = process.env[name];
    if (v && v.trim()) return v.trim();
  }

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "";
  }

  throw new Error(`Missing required env: one of [${names.join(", ")}]`);
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  // Backward compatible: some setups use AUTH_SECRET instead of JWT_SECRET
  JWT_SECRET: requiredOneOf(["JWT_SECRET", "AUTH_SECRET"]),

  APP_BASE_URL: optional("APP_BASE_URL", "http://localhost:3000"),

  // Observability (optional)
  // Set e.g. PRISMA_LOG_QUERIES=1 to enable query logs in dev/test.
  PRISMA_LOG_QUERIES: optional("PRISMA_LOG_QUERIES"),

  // Audit log sampling: set e.g. AUDIT_SAMPLE_RATE=0.2 for 20% sampling.
  // Defaults to 1.0 (no sampling).
  AUDIT_SAMPLE_RATE: optional("AUDIT_SAMPLE_RATE", "1"),

  // Audit log retention / cleanup (best-effort)
  // Keep logs for N days (default 90). Cleanup runs probabilistically to avoid overhead.
  AUDIT_RETENTION_DAYS: optional("AUDIT_RETENTION_DAYS", "90"),
  AUDIT_CLEANUP_PROB: optional("AUDIT_CLEANUP_PROB", "0.01"),

  // Optional secret for cron/maintenance endpoints
  CRON_SECRET: optional("CRON_SECRET"),
  // Optional allowlist for cron callers. Comma-separated IPs or prefixes (e.g. "10.0.0.,127.0.0.1").
  CRON_IP_ALLOWLIST: optional("CRON_IP_ALLOWLIST"),
  // Optional HMAC secret. If set, require x-cron-ts + x-cron-signature.
  CRON_HMAC_SECRET: optional("CRON_HMAC_SECRET"),

  // Export storage
  EXPORT_DIR: optional("EXPORT_DIR", "var/exports"),
  EXPORT_RETENTION_DAYS: optional("EXPORT_RETENTION_DAYS", "7"),
  EXPORT_MAX_ROWS: optional("EXPORT_MAX_ROWS", "100000"),
  EXPORT_PAGE_SIZE: optional("EXPORT_PAGE_SIZE", "1000"),

  // Meta search can be expensive on SQLite; default to a recent window if user didn't specify.
  META_SEARCH_DEFAULT_DAYS: optional("META_SEARCH_DEFAULT_DAYS", "7"),

  SMTP_HOST: optional("SMTP_HOST"),
  SMTP_PORT: optional("SMTP_PORT"),
  SMTP_USER: optional("SMTP_USER"),
  SMTP_PASS: optional("SMTP_PASS"),
  SMTP_FROM: optional("SMTP_FROM", "no-reply@example.com"),
};
