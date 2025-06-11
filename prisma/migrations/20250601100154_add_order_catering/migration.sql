/*
  Warnings:

  - Added the required column `cost` to the `OrderAddonItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cost` to the `OrderProductItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `OrderProductItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_package_id_fkey";

-- AlterTable
ALTER TABLE "OrderAddonItem" ADD COLUMN     "cost" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "OrderProductItem" ADD COLUMN     "cost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "OrderCatering" (
    "id" SERIAL NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "catering_package_id" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "free_cup" INTEGER,
    "size_unit" TEXT NOT NULL,
    "size_volume" INTEGER NOT NULL,
    "quantity_cup" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "OrderCatering_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderCatering" ADD CONSTRAINT "OrderCatering_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCatering" ADD CONSTRAINT "OrderCatering_catering_package_id_fkey" FOREIGN KEY ("catering_package_id") REFERENCES "CateringPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
