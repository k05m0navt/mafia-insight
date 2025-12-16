-- AlterTable
ALTER TABLE "users" ADD COLUMN     "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "syncSchedule" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3);
