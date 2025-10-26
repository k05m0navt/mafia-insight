-- CreateEnum
CREATE TYPE "SyncType" AS ENUM ('FULL', 'INCREMENTAL');

-- CreateEnum
CREATE TYPE "SyncStatusEnum" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EntitySyncStatus" AS ENUM ('SYNCED', 'PENDING', 'ERROR');

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "syncStatus" "EntitySyncStatus";

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "syncStatus" "EntitySyncStatus";

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "recordsProcessed" INTEGER,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_status" (
    "id" TEXT NOT NULL,
    "lastSyncTime" TIMESTAMP(3),
    "lastSyncType" TEXT,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER,
    "currentOperation" TEXT,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_status_pkey" PRIMARY KEY ("id")
);

-- Insert initial sync status record
INSERT INTO "sync_status" ("id", "isRunning", "updatedAt")
VALUES ('current', false, CURRENT_TIMESTAMP);
