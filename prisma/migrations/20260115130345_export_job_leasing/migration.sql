-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLogExportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "requestedByUserId" TEXT,
    "filters" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "filePath" TEXT,
    "leaseUntil" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "csvBase64" TEXT,
    "error" TEXT
);
INSERT INTO "new_AuditLogExportJob" ("createdAt", "csvBase64", "error", "fileName", "filePath", "filters", "id", "mimeType", "requestedByUserId", "status", "updatedAt") SELECT "createdAt", "csvBase64", "error", "fileName", "filePath", "filters", "id", "mimeType", "requestedByUserId", "status", "updatedAt" FROM "AuditLogExportJob";
DROP TABLE "AuditLogExportJob";
ALTER TABLE "new_AuditLogExportJob" RENAME TO "AuditLogExportJob";
CREATE INDEX "AuditLogExportJob_status_createdAt_idx" ON "AuditLogExportJob"("status", "createdAt");
CREATE INDEX "AuditLogExportJob_requestedByUserId_createdAt_idx" ON "AuditLogExportJob"("requestedByUserId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
