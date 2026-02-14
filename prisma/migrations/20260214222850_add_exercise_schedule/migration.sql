-- CreateEnum
CREATE TYPE "exercise_type" AS ENUM ('CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE');

-- CreateEnum
CREATE TYPE "exercise_intensity" AS ENUM ('MEDIUM', 'LOW', 'HIGH');

-- CreateTable
CREATE TABLE "exercise_schedules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intensity" TEXT,
    "duration" INTEGER,
    "note" TEXT,
    "scheduleTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercise_schedules_userId_idx" ON "exercise_schedules"("userId");

-- CreateIndex
CREATE INDEX "exercise_schedules_scheduleTime_idx" ON "exercise_schedules"("scheduleTime");

-- AddForeignKey
ALTER TABLE "exercise_schedules" ADD CONSTRAINT "exercise_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
