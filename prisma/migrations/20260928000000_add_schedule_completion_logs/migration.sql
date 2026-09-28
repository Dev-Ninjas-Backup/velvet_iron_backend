-- CreateTable
CREATE TABLE "schedule_completion_logs" (
    "id" TEXT NOT NULL,
    "scheduleItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_completion_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_completion_logs_userId_idx" ON "schedule_completion_logs"("userId");

-- CreateIndex
CREATE INDEX "schedule_completion_logs_scheduleItemId_idx" ON "schedule_completion_logs"("scheduleItemId");

-- AddForeignKey
ALTER TABLE "schedule_completion_logs" ADD CONSTRAINT "schedule_completion_logs_scheduleItemId_fkey" FOREIGN KEY ("scheduleItemId") REFERENCES "scheduled_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_completion_logs" ADD CONSTRAINT "schedule_completion_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
