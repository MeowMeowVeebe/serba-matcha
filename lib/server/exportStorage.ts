import fs from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

export function resolveExportPath(relPath: string) {
  // Prevent path traversal
  const safeRel = relPath.replace(/\\/g, "/");
  const normalized = path.posix.normalize(safeRel).replace(/^\.\//, "");
  if (normalized.startsWith("..")) {
    throw new Error("Invalid export path");
  }
  return path.join(env.EXPORT_DIR, normalized);
}

export async function ensureExportDir() {
  await fs.mkdir(env.EXPORT_DIR, { recursive: true });
}

export async function writeExportFile(relPath: string, content: string | Buffer) {
  await ensureExportDir();
  const full = resolveExportPath(relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content);
  return full;
}

export async function readExportFile(relPath: string) {
  const full = resolveExportPath(relPath);
  return fs.readFile(full);
}
