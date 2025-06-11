/*
  Warnings:

  - The values [CAPTURE,SETTLEMENT,DENY,CANCEL,REFUND,PARTIAL_REFUND,AUTHORIZE] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('PENDING', 'EXPIRE', 'FAILURE', 'SUCCESS');
ALTER TABLE "Payment" ALTER COLUMN "trx_status" TYPE "TransactionStatus_new" USING ("trx_status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";
COMMIT;
