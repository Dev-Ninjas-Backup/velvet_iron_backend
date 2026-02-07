/*
  Warnings:

  - The `energyLevel` column on the `mood_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hungerLevel` column on the `mood_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `mood` on the `mood_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('TIRED', 'GOOD', 'PISSED', 'GREAT', 'POOR');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('EXHAUSTED', 'LOW', 'MODERATE', 'ENERGIZED', 'HIGH');

-- CreateEnum
CREATE TYPE "HungerLevel" AS ENUM ('NOT_HUNGRY', 'HUNGRY', 'VERY_HUNGRY');

-- AlterTable
ALTER TABLE "mood_logs" DROP COLUMN "mood",
ADD COLUMN     "mood" "Mood" NOT NULL,
DROP COLUMN "energyLevel",
ADD COLUMN     "energyLevel" "EnergyLevel",
DROP COLUMN "hungerLevel",
ADD COLUMN     "hungerLevel" "HungerLevel";
