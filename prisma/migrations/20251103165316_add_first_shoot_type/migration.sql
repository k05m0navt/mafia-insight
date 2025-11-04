-- AlterTable: Add firstShootType enum and column to game_participations

-- Create enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "FirstShootType" AS ENUM ('NONE', 'ZERO_MAFIA', 'ONE_TWO_MAFIA', 'THREE_MAFIA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add column with default value
ALTER TABLE "game_participations" 
ADD COLUMN IF NOT EXISTS "firstShootType" "FirstShootType" DEFAULT 'NONE';

-- Update existing NULL values to 'NONE' (if any)
UPDATE "game_participations" 
SET "firstShootType" = 'NONE' 
WHERE "firstShootType" IS NULL;

