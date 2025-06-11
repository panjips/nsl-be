/*
  Warnings:

  - Added the required column `subtotal` to the `OrderAddonItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderAddonItem" ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL;
