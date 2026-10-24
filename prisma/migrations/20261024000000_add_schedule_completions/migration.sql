-- CreateTable
CREATE TABLE IF NOT EXISTS "schedule_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "scheduleType" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "earnedXp" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "schedule_completions_userId_scheduleId_date_key" ON "schedule_completions"("userId", "scheduleId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "schedule_completions_userId_date_idx" ON "schedule_completions"("userId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "schedule_completions_scheduleId_date_idx" ON "schedule_completions"("scheduleId", "date");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'schedule_completions_userId_fkey'
    ) THEN
        ALTER TABLE "schedule_completions" ADD CONSTRAINT "schedule_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Data Repair: Populate daysOfWeek for existing SPECIFIC_DAYS or WEEKLY schedules that have empty daysOfWeek
UPDATE "exercise_schedule_logs"
SET "daysOfWeek" = ARRAY[EXTRACT(ISODOW FROM "loggedAt")::integer]
WHERE "recurrence" IN ('WEEKLY', 'SPECIFIC_DAYS')
  AND ("daysOfWeek" IS NULL OR "daysOfWeek" = '{}'::integer[]);

UPDATE "medication_schedules"
SET "daysOfWeek" = ARRAY[EXTRACT(ISODOW FROM "scheduleTime")::integer]
WHERE "recurrence" IN ('WEEKLY', 'SPECIFIC_DAYS')
  AND ("daysOfWeek" IS NULL OR "daysOfWeek" = '{}'::integer[]);
