-- Add indexes for import performance optimization
-- Migration: add_import_indexes
-- Date: October 26, 2025
-- Purpose: Optimize gomafiaId lookups and import-related queries

-- Indexes for clubs table
CREATE INDEX IF NOT EXISTS "idx_clubs_gomafia_id" ON "clubs" ("gomafiaId") WHERE "gomafiaId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_clubs_region" ON "clubs" ("region") WHERE "region" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_clubs_sync_status" ON "clubs" ("syncStatus");
CREATE INDEX IF NOT EXISTS "idx_clubs_last_sync_at" ON "clubs" ("lastSyncAt");

-- Indexes for tournaments table
CREATE INDEX IF NOT EXISTS "idx_tournaments_gomafia_id" ON "tournaments" ("gomafiaId") WHERE "gomafiaId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_tournaments_sync_status" ON "tournaments" ("syncStatus");
CREATE INDEX IF NOT EXISTS "idx_tournaments_last_sync_at" ON "tournaments" ("lastSyncAt");
CREATE INDEX IF NOT EXISTS "idx_tournaments_start_date" ON "tournaments" ("startDate");
CREATE INDEX IF NOT EXISTS "idx_tournaments_status" ON "tournaments" ("status");

-- Indexes for players table (additional)
CREATE INDEX IF NOT EXISTS "idx_players_region" ON "players" ("region") WHERE "region" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_players_club_id" ON "players" ("clubId") WHERE "clubId" IS NOT NULL;

-- Indexes for player_year_stats table
CREATE INDEX IF NOT EXISTS "idx_player_year_stats_player_id" ON "player_year_stats" ("playerId");
CREATE INDEX IF NOT EXISTS "idx_player_year_stats_year" ON "player_year_stats" ("year");
CREATE INDEX IF NOT EXISTS "idx_player_year_stats_player_year" ON "player_year_stats" ("playerId", "year");

-- Indexes for player_tournaments table
CREATE INDEX IF NOT EXISTS "idx_player_tournaments_player_id" ON "player_tournaments" ("playerId");
CREATE INDEX IF NOT EXISTS "idx_player_tournaments_tournament_id" ON "player_tournaments" ("tournamentId");
CREATE INDEX IF NOT EXISTS "idx_player_tournaments_placement" ON "player_tournaments" ("placement") WHERE "placement" IS NOT NULL;

-- Indexes for game_participations table (performance)
CREATE INDEX IF NOT EXISTS "idx_game_participations_player_id" ON "game_participations" ("playerId");
CREATE INDEX IF NOT EXISTS "idx_game_participations_game_id" ON "game_participations" ("gameId");
CREATE INDEX IF NOT EXISTS "idx_game_participations_role" ON "game_participations" ("role");

-- Composite indexes for common import queries
CREATE INDEX IF NOT EXISTS "idx_clubs_sync_status_last_sync" ON "clubs" ("syncStatus", "lastSyncAt");
CREATE INDEX IF NOT EXISTS "idx_tournaments_sync_status_last_sync" ON "tournaments" ("syncStatus", "lastSyncAt");

-- Index for tournament games lookup (frequently used in import)
CREATE INDEX IF NOT EXISTS "idx_games_tournament_id_date" ON "games" ("tournamentId", "date") WHERE "tournamentId" IS NOT NULL;

-- Comments explaining index purposes
COMMENT ON INDEX "idx_clubs_gomafia_id" IS 'Optimize duplicate detection during club import by gomafiaId lookup';
COMMENT ON INDEX "idx_tournaments_gomafia_id" IS 'Optimize duplicate detection during tournament import by gomafiaId lookup';
COMMENT ON INDEX "idx_player_year_stats_player_year" IS 'Optimize year stats upsert operations during import';
COMMENT ON INDEX "idx_player_tournaments_player_id" IS 'Optimize player tournament history import and queries';
COMMENT ON INDEX "idx_game_participations_player_id" IS 'Optimize player participation lookups during statistics calculation';

