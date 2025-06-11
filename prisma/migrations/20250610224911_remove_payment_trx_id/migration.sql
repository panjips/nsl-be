/*
  Warnings:

  - You are about to drop the column `payment_trx_id` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "payment_trx_id";
