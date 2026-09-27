-- CreateEnum
CREATE TYPE "CalorieGoalMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "ScheduleItemType" AS ENUM ('MEDICATION', 'WORKOUT', 'MEAL', 'GENERAL');

-- CreateEnum
CREATE TYPE "ScheduleRecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'SPECIFIC_DAYS');

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "calorieGoal" DOUBLE PRECISION,
ADD COLUMN "calorieGoalMode" "CalorieGoalMode" NOT NULL DEFAULT 'AUTO';

-- AlterTable
ALTER TABLE "macro_goals" ADD COLUMN "calorieGoalMode" "CalorieGoalMode" NOT NULL DEFAULT 'AUTO';

-- CreateTable
CREATE TABLE "scheduled_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" "ScheduleItemType" NOT NULL DEFAULT 'WORKOUT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recurrenceType" "ScheduleRecurrenceType" NOT NULL DEFAULT 'NONE',
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "timeOfDay" TEXT,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATE,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_items_userId_idx" ON "scheduled_items"("userId");

-- CreateIndex
CREATE INDEX "scheduled_items_userId_startDate_idx" ON "scheduled_items"("userId", "startDate");

-- AddForeignKey
ALTER TABLE "scheduled_items" ADD CONSTRAINT "scheduled_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
