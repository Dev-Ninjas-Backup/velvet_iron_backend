/*
  Warnings:

  - The primary key for the `onboarding` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "onboarding" DROP CONSTRAINT "onboarding_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "onboarding_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "onboarding_id_seq";
