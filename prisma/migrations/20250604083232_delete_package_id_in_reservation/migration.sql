/*
  Warnings:

  - You are about to drop the column `is_use_carte` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `package_id` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "is_use_carte",
DROP COLUMN "package_id",
ADD COLUMN     "is_use_cart" BOOLEAN NOT NULL DEFAULT false;
