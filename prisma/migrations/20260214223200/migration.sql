/*
  Warnings:

  - The `intensity` column on the `exercise_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `exercise_schedules` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `exercise_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "exercise_schedules" DROP CONSTRAINT "exercise_schedules_userId_fkey";

-- AlterTable
ALTER TABLE "exercise_logs" DROP COLUMN "type",
ADD COLUMN     "type" "exercise_type" NOT NULL,
DROP COLUMN "intensity",
ADD COLUMN     "intensity" "exercise_intensity";

-- DropTable
DROP TABLE "exercise_schedules";

-- CreateTable
CREATE TABLE "exercise_schedule_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "exercise_type" NOT NULL,
    "name" TEXT NOT NULL,
    "intensity" "exercise_intensity",
    "duration" INTEGER,
    "note" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_schedule_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercise_schedule_logs_userId_idx" ON "exercise_schedule_logs"("userId");

-- CreateIndex
CREATE INDEX "exercise_schedule_logs_loggedAt_idx" ON "exercise_schedule_logs"("loggedAt");

-- AddForeignKey
ALTER TABLE "exercise_schedule_logs" ADD CONSTRAINT "exercise_schedule_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
