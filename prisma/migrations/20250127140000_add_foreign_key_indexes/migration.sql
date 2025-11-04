-- Add indexes on foreign key columns for improved query performance
-- Note: These indexes were created using CONCURRENTLY via direct SQL execution for zero-downtime
-- This migration file documents the indexes that were created
-- For future deployments, use: CREATE INDEX IF NOT EXISTS (without CONCURRENTLY in transactions)

-- Indexes for clubs table
CREATE INDEX IF NOT EXISTS idx_clubs_created_by ON clubs("createdBy");
CREATE INDEX IF NOT EXISTS idx_clubs_president_id ON clubs("presidentId");

-- Indexes for players table
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players("userId");
CREATE INDEX IF NOT EXISTS idx_players_club_id ON players("clubId");

-- Indexes for games table
CREATE INDEX IF NOT EXISTS idx_games_tournament_id ON games("tournamentId");

-- Indexes for tournaments table
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments("createdBy");

-- Indexes for player_tournaments table
CREATE INDEX IF NOT EXISTS idx_player_tournaments_tournament_id ON player_tournaments("tournamentId");

-- Indexes for game_participations table
CREATE INDEX IF NOT EXISTS idx_game_participations_game_id ON game_participations("gameId");

