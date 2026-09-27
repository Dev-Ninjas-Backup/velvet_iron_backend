-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN "dailyStepGoal" INTEGER NOT NULL DEFAULT 8000,
ADD COLUMN "lifetimeSteps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "totalCampsites" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "step_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "goal" INTEGER NOT NULL DEFAULT 8000,
    "date" DATE NOT NULL,
    "isCampSet" BOOLEAN NOT NULL DEFAULT false,
    "campSetAt" TIMESTAMP(3),
    "earnedXp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "step_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "step_logs_userId_idx" ON "step_logs"("userId");

-- CreateIndex
CREATE INDEX "step_logs_date_idx" ON "step_logs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "step_logs_userId_date_key" ON "step_logs"("userId", "date");

-- AddForeignKey
ALTER TABLE "step_logs" ADD CONSTRAINT "step_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

