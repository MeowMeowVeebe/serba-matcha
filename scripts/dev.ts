import { existsSync } from "node:fs";
import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

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

  // Ensure DB schema exists (SQLite dev)
  // Safe to run repeatedly; deploy is a no-op when migrations are already applied.
  run("npx", ["prisma", "migrate", "deploy"]);

  // Start Next dev (forward args)
  const args = ["next", "dev", ...process.argv.slice(2)];
  const code = run("npx", args);
  process.exit(code);
}

main();
