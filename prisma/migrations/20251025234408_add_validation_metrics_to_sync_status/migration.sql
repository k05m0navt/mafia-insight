-- AlterTable: Add validation metrics fields to sync_status
ALTER TABLE "sync_status" ADD COLUMN "validationRate" DOUBLE PRECISION;
ALTER TABLE "sync_status" ADD COLUMN "totalRecordsProcessed" INTEGER;
ALTER TABLE "sync_status" ADD COLUMN "validRecords" INTEGER;
ALTER TABLE "sync_status" ADD COLUMN "invalidRecords" INTEGER;

