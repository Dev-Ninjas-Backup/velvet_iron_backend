-- AlterTable
ALTER TABLE "weight_logs" ALTER COLUMN "weight" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "xp_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "xp_logs_userId_idx" ON "xp_logs"("userId");

-- CreateIndex
CREATE INDEX "xp_logs_createdAt_idx" ON "xp_logs"("createdAt");

-- CreateIndex
CREATE INDEX "xp_logs_userId_createdAt_idx" ON "xp_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "xp_logs" ADD CONSTRAINT "xp_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
