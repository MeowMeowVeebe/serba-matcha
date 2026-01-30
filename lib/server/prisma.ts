import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/server/env";

declare global {
  // Global cache untuk dev agar PrismaClient tidak bikin koneksi berulang saat HMR.
  var __prisma: PrismaClient | undefined;
}

const shouldLogQueries =
  process.env.NODE_ENV !== "production" &&
  Boolean(env.PRISMA_LOG_QUERIES) &&
  env.PRISMA_LOG_QUERIES !== "0";

export const prisma =
  global.__prisma ??
  new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: shouldLogQueries ? ["query", "warn", "error"] : ["warn", "error"],
  });

// In development, a common cause of 500s is Prisma Client being generated
// for a different provider than the current DATABASE_URL (e.g., mysql vs sqlite).
// scripts/dev.ts now runs `prisma generate --schema <selected>` to prevent that.

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
