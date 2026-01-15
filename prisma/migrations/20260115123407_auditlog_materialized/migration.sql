-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "metaPreview" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "resource" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "statusCode" INTEGER;
ALTER TABLE "AuditLog" ADD COLUMN "targetEmail" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "targetUserId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_targetUserId_createdAt_idx" ON "AuditLog"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetEmail_createdAt_idx" ON "AuditLog"("targetEmail", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resource_createdAt_idx" ON "AuditLog"("resource", "createdAt");
