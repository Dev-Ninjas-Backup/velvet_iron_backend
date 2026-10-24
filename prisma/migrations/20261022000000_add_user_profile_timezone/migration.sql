-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'America/Chicago';
UPDATE "user_profiles" SET "timezone" = 'America/Chicago' WHERE "timezone" IS NULL;

