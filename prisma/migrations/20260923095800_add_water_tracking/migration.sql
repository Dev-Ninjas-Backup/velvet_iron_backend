-- CreateEnum
CREATE TYPE "WaterUnit" AS ENUM ('OZ', 'ML');

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "dailyWaterGoal" DOUBLE PRECISION NOT NULL DEFAULT 64,
ADD COLUMN "waterUnit" "WaterUnit" NOT NULL DEFAULT 'OZ';

-- CreateTable
CREATE TABLE "water_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" "WaterUnit" NOT NULL DEFAULT 'OZ',
    "amountMl" DOUBLE PRECISION NOT NULL,
    "amountOz" DOUBLE PRECISION NOT NULL,
    "earnedXp" INTEGER NOT NULL DEFAULT 5,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "water_logs_userId_idx" ON "water_logs"("userId");

-- CreateIndex
CREATE INDEX "water_logs_loggedAt_idx" ON "water_logs"("loggedAt");

-- AddForeignKey
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

