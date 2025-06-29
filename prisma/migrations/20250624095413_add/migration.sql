-- CreateEnum
CREATE TYPE "SugarType" AS ENUM ('NORMAL', 'LESS_SUGAR', 'NO_SUGAR');

-- AlterTable
ALTER TABLE "OrderProductItem" ADD COLUMN     "selected_sugar_type" "SugarType";

-- AlterTable
ALTER TABLE "ProductRecipe" ADD COLUMN     "sugar_type" "SugarType";
