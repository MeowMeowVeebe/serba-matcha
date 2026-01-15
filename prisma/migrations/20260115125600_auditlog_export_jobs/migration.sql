-- CreateTable
CREATE TABLE "AuditLogExportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "requestedByUserId" TEXT,
    "filters" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "csvBase64" TEXT,
    "error" TEXT
);

-- CreateIndex
CREATE INDEX "AuditLogExportJob_status_createdAt_idx" ON "AuditLogExportJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLogExportJob_requestedByUserId_createdAt_idx" ON "AuditLogExportJob"("requestedByUserId", "createdAt");
