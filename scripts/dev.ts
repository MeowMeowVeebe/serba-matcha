import { existsSync, readFileSync } from "node:fs";
import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

function loadDotEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    // remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function run(cmd: string, args: string[]) {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: true });
  return res.status ?? 0;
}

function killPortWindows(port: number) {
  // netstat output example: TCP    0.0.0.0:3000  ... LISTENING  1234
  const res = spawnSync("cmd", ["/c", `netstat -ano | findstr :${port}`], { encoding: "utf8" });
  const out = `${res.stdout ?? ""}\n${res.stderr ?? ""}`;
  const pids = new Set<number>();

  for (const line of out.split(/\r?\n/)) {
    if (!line.includes(`:${port}`) || !line.toUpperCase().includes("LISTENING")) continue;
    const parts = line.trim().split(/\s+/);
    const pid = Number(parts.at(-1));
    if (Number.isFinite(pid) && pid > 0) pids.add(pid);
  }

  for (const pid of pids) {
    run("taskkill", ["/PID", String(pid), "/F"]);
  }
}

function cleanupNextLock() {
  const lockPath = join(process.cwd(), ".next", "dev", "lock");
  if (existsSync(lockPath)) {
    try {
      rmSync(lockPath, { force: true });
    } catch {
      // ignore
    }
  }
}

function main() {
  // Only auto-kill in dev
  if (process.env.NODE_ENV !== "production") {
    if (process.platform === "win32") {
      killPortWindows(3000);
    }
    cleanupNextLock();
  }

  // Load local env so Prisma CLI and Next dev share the same DATABASE_URL.
  // Prisma CLI reads `.env` by default, but Next uses `.env.local` in dev.
  // This prevents 500 errors caused by missing DATABASE_URL or a mismatched Prisma Client provider.
  loadDotEnvFile(join(process.cwd(), ".env.local"));
  loadDotEnvFile(join(process.cwd(), ".env"));

  // Ensure DB schema exists.
  // Default dev uses SQLite schema for local convenience.
  // To use MySQL schema locally, set PRISMA_SCHEMA=prisma/schema.prisma
  const schema = process.env.PRISMA_SCHEMA || "prisma/schema.sqlite.prisma";

  // If using SQLite schema and no DATABASE_URL was provided, fall back to dev.db
  if (schema.includes("schema.sqlite.prisma") && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./prisma/dev.db";
  }

  run("npx", ["prisma", "db", "push", "--schema", schema]);
  // Ensure Prisma Client is generated for the same provider (SQLite/MySQL)
  run("npx", ["prisma", "generate", "--schema", schema]);

  // Start Next dev (forward args)
  const args = ["next", "dev", ...process.argv.slice(2)];
  const code = run("npx", args);
  process.exit(code);
}

main();
