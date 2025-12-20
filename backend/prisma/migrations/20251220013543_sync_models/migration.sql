-- DropIndex
DROP INDEX "Notification_targetUserId_idx";

-- CreateIndex
CREATE INDEX "Notification_targetUserId_createdAt_idx" ON "Notification"("targetUserId", "createdAt");
