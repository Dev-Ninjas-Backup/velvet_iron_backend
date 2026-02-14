/*
  Warnings:

  - You are about to drop the column `medicationId` on the `medication_schedules` table. All the data in the column will be lost.
  - You are about to alter the column `doseMg` on the `medication_schedules` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to drop the `medication_logs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `medication_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "medication_logs" DROP CONSTRAINT "medication_logs_medicationId_fkey";

-- DropForeignKey
ALTER TABLE "medication_schedules" DROP CONSTRAINT "medication_schedules_medicationId_fkey";

-- DropIndex
DROP INDEX "medication_schedules_medicationId_idx";

-- AlterTable
ALTER TABLE "medication_schedules" DROP COLUMN "medicationId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "type" "MedicationType",
ALTER COLUMN "doseMg" DROP NOT NULL,
ALTER COLUMN "doseMg" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "medications" ADD COLUMN     "doseMg" INTEGER;

-- DropTable
DROP TABLE "medication_logs";
