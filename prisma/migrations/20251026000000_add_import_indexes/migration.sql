-- Add indexes for import performance optimization
-- Migration: add_import_indexes
-- Date: October 26, 2025
-- Purpose: Optimize gomafiaId lookups and import-related queries
-- Note: This migration is defensive and checks for column existence before creating indexes
-- to handle cases where columns may be added in later migrations

-- Indexes for clubs table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'gomafiaId') THEN
        CREATE INDEX IF NOT EXISTS "idx_clubs_gomafia_id" ON "clubs" ("gomafiaId") WHERE "gomafiaId" IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'region') THEN
        CREATE INDEX IF NOT EXISTS "idx_clubs_region" ON "clubs" ("region") WHERE "region" IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'syncStatus') THEN
        CREATE INDEX IF NOT EXISTS "idx_clubs_sync_status" ON "clubs" ("syncStatus");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'lastSyncAt') THEN
        CREATE INDEX IF NOT EXISTS "idx_clubs_last_sync_at" ON "clubs" ("lastSyncAt");
    END IF;
    -- Composite index (only if both columns exist)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'syncStatus')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'lastSyncAt') THEN
        CREATE INDEX IF NOT EXISTS "idx_clubs_sync_status_last_sync" ON "clubs" ("syncStatus", "lastSyncAt");
    END IF;
END $$;

-- Indexes for tournaments table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'gomafiaId') THEN
        CREATE INDEX IF NOT EXISTS "idx_tournaments_gomafia_id" ON "tournaments" ("gomafiaId") WHERE "gomafiaId" IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'syncStatus') THEN
        CREATE INDEX IF NOT EXISTS "idx_tournaments_sync_status" ON "tournaments" ("syncStatus");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'lastSyncAt') THEN
        CREATE INDEX IF NOT EXISTS "idx_tournaments_last_sync_at" ON "tournaments" ("lastSyncAt");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'startDate') THEN
        CREATE INDEX IF NOT EXISTS "idx_tournaments_start_date" ON "tournaments" ("startDate");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS "idx_tournaments_status" ON "tournaments" ("status");
    END IF;
    -- Composite index (only if both columns exist)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'syncStatus')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'lastSyncAt') THEN
        CREATE INDEX IF NOT EXISTS "idx_tournaments_sync_status_last_sync" ON "tournaments" ("syncStatus", "lastSyncAt");
    END IF;
END $$;

-- Indexes for players table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'region') THEN
        CREATE INDEX IF NOT EXISTS "idx_players_region" ON "players" ("region") WHERE "region" IS NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'clubId') THEN
        CREATE INDEX IF NOT EXISTS "idx_players_club_id" ON "players" ("clubId") WHERE "clubId" IS NOT NULL;
    END IF;
END $$;

-- Indexes for player_year_stats table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_year_stats') THEN
        CREATE INDEX IF NOT EXISTS "idx_player_year_stats_player_id" ON "player_year_stats" ("playerId");
        CREATE INDEX IF NOT EXISTS "idx_player_year_stats_year" ON "player_year_stats" ("year");
        CREATE INDEX IF NOT EXISTS "idx_player_year_stats_player_year" ON "player_year_stats" ("playerId", "year");
    END IF;
END $$;

-- Indexes for player_tournaments table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_tournaments') THEN
        CREATE INDEX IF NOT EXISTS "idx_player_tournaments_player_id" ON "player_tournaments" ("playerId");
        CREATE INDEX IF NOT EXISTS "idx_player_tournaments_tournament_id" ON "player_tournaments" ("tournamentId");
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_tournaments' AND column_name = 'placement') THEN
            CREATE INDEX IF NOT EXISTS "idx_player_tournaments_placement" ON "player_tournaments" ("placement") WHERE "placement" IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Indexes for game_participations table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_participations') THEN
        CREATE INDEX IF NOT EXISTS "idx_game_participations_player_id" ON "game_participations" ("playerId");
        CREATE INDEX IF NOT EXISTS "idx_game_participations_game_id" ON "game_participations" ("gameId");
        CREATE INDEX IF NOT EXISTS "idx_game_participations_role" ON "game_participations" ("role");
    END IF;
END $$;

-- Index for tournament games lookup (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'tournamentId')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'date') THEN
        CREATE INDEX IF NOT EXISTS "idx_games_tournament_id_date" ON "games" ("tournamentId", "date") WHERE "tournamentId" IS NOT NULL;
    END IF;
END $$;

-- Comments explaining index purposes (only if indexes exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clubs_gomafia_id') THEN
        COMMENT ON INDEX "idx_clubs_gomafia_id" IS 'Optimize duplicate detection during club import by gomafiaId lookup';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournaments_gomafia_id') THEN
        COMMENT ON INDEX "idx_tournaments_gomafia_id" IS 'Optimize duplicate detection during tournament import by gomafiaId lookup';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_player_year_stats_player_year') THEN
        COMMENT ON INDEX "idx_player_year_stats_player_year" IS 'Optimize year stats upsert operations during import';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_player_tournaments_player_id') THEN
        COMMENT ON INDEX "idx_player_tournaments_player_id" IS 'Optimize player tournament history import and queries';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_game_participations_player_id') THEN
        COMMENT ON INDEX "idx_game_participations_player_id" IS 'Optimize player participation lookups during statistics calculation';
    END IF;
END $$;
