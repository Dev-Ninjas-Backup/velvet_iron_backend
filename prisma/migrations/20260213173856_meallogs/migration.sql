/*
  Warnings:

  - Changed the type of `mealType` on the `meal_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mealType` on the `meal_schedules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- AlterTable
ALTER TABLE "meal_logs" DROP COLUMN "mealType",
ADD COLUMN     "mealType" "MealType" NOT NULL;

-- AlterTable
ALTER TABLE "meal_schedules" ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "carbs" INTEGER,
ADD COLUMN     "fats" INTEGER,
ADD COLUMN     "protein" INTEGER,
DROP COLUMN "mealType",
ADD COLUMN     "mealType" "MealType" NOT NULL;
