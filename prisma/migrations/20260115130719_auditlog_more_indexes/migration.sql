-- CreateIndex
CREATE INDEX "AuditLog_statusCode_createdAt_idx" ON "AuditLog"("statusCode", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetEmail_statusCode_createdAt_idx" ON "AuditLog"("targetEmail", "statusCode", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resource_statusCode_createdAt_idx" ON "AuditLog"("resource", "statusCode", "createdAt");
