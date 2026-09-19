-- AlterTable
ALTER TABLE "exercise_schedule_logs" ADD COLUMN     "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastTakenDate" TIMESTAMP(3),
ADD COLUMN     "recurrence" TEXT NOT NULL DEFAULT 'NEVER',
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeOfDay" TEXT;

-- AlterTable
ALTER TABLE "meal_schedules" ADD COLUMN     "lastTakenDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "medication_schedules" ADD COLUMN     "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastTakenDate" TIMESTAMP(3),
ADD COLUMN     "recurrence" TEXT NOT NULL DEFAULT 'ONCE',
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "custom_quests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "recurrence" TEXT NOT NULL DEFAULT 'NONE',
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "lastCompletedAt" TIMESTAMP(3),
    "xp" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_quests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_quests_userId_idx" ON "custom_quests"("userId");

-- AddForeignKey
ALTER TABLE "custom_quests" ADD CONSTRAINT "custom_quests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
