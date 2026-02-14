/*
  Warnings:

  - The `type` column on the `medications` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MedicationType" AS ENUM ('CAPSULE', 'INJECTION', 'LIQUID', 'TABLET');

-- AlterTable
ALTER TABLE "medications" DROP COLUMN "type", 
ADD COLUMN     "type" "MedicationType";
