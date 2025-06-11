/*
  Warnings:

  - You are about to drop the column `size_name` on the `CateringPackage` table. All the data in the column will be lost.
  - You are about to drop the column `size_value` on the `CateringPackage` table. All the data in the column will be lost.
  - You are about to drop the column `order_trx_id` on the `Order` table. All the data in the column will be lost.
  - Added the required column `size_unit` to the `CateringPackage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size_volume` to the `CateringPackage` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Order_order_trx_id_key";

-- AlterTable
ALTER TABLE "CateringPackage" DROP COLUMN "size_name",
DROP COLUMN "size_value",
ADD COLUMN     "size_unit" TEXT NOT NULL,
ADD COLUMN     "size_volume" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "order_trx_id";
