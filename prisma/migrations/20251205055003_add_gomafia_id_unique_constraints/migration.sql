-- Add unique constraints on gomafiaId columns for clubs and tournaments tables
-- This ensures data integrity and prevents duplicate gomafiaId values

-- Add unique constraint on clubs.gomafiaId (only if column exists and constraint doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'gomafiaId') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'clubs_gomafiaId_key' 
            AND conrelid = 'clubs'::regclass
        ) THEN
            -- Check for existing duplicates before adding constraint
            IF NOT EXISTS (
                SELECT 1 FROM clubs 
                WHERE "gomafiaId" IS NOT NULL 
                GROUP BY "gomafiaId" 
                HAVING COUNT(*) > 1
            ) THEN
                ALTER TABLE "clubs" ADD CONSTRAINT "clubs_gomafiaId_key" UNIQUE ("gomafiaId");
            ELSE
                RAISE WARNING 'Cannot add unique constraint: duplicate gomafiaId values exist in clubs table';
            END IF;
        END IF;
    END IF;
END $$;

-- Add unique constraint on tournaments.gomafiaId (only if column exists and constraint doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'gomafiaId') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'tournaments_gomafiaId_key' 
            AND conrelid = 'tournaments'::regclass
        ) THEN
            -- Check for existing duplicates before adding constraint
            IF NOT EXISTS (
                SELECT 1 FROM tournaments 
                WHERE "gomafiaId" IS NOT NULL 
                GROUP BY "gomafiaId" 
                HAVING COUNT(*) > 1
            ) THEN
                ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_gomafiaId_key" UNIQUE ("gomafiaId");
            ELSE
                RAISE WARNING 'Cannot add unique constraint: duplicate gomafiaId values exist in tournaments table';
            END IF;
        END IF;
    END IF;
END $$;
