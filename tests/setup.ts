import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { beforeAll } from "vitest";

process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/test.db";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
// Ensure dev-like behavior for API routes that hide debug info in production (e.g. forgot-password resetUrl)
// NODE_ENV is read-only in Node 18+; use a separate flag for tests.
process.env.NEXT_PUBLIC_TEST_MODE = "true";

export function resetTestDb() {
  const p = "prisma/test.db";
  if (existsSync(p)) rmSync(p);

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env },
  });
}

beforeAll(() => {
  resetTestDb();
});
