-- Add indexes on foreign key columns for improved query performance
-- Note: These indexes were created using CONCURRENTLY via direct SQL execution for zero-downtime
-- This migration file documents the indexes that were created
-- For future deployments, use: CREATE INDEX IF NOT EXISTS (without CONCURRENTLY in transactions)
-- This migration is defensive and checks for column existence before creating indexes

-- Indexes for clubs table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'createdBy') THEN
        CREATE INDEX IF NOT EXISTS idx_clubs_created_by ON clubs("createdBy");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'presidentId') THEN
        CREATE INDEX IF NOT EXISTS idx_clubs_president_id ON clubs("presidentId");
    END IF;
END $$;

-- Indexes for players table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'userId') THEN
        CREATE INDEX IF NOT EXISTS idx_players_user_id ON players("userId");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'clubId') THEN
        CREATE INDEX IF NOT EXISTS idx_players_club_id ON players("clubId");
    END IF;
END $$;

-- Indexes for games table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'tournamentId') THEN
        CREATE INDEX IF NOT EXISTS idx_games_tournament_id ON games("tournamentId");
    END IF;
END $$;

-- Indexes for tournaments table (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'createdBy') THEN
        CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments("createdBy");
    END IF;
END $$;

-- Indexes for player_tournaments table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_tournaments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'player_tournaments' AND column_name = 'tournamentId') THEN
            CREATE INDEX IF NOT EXISTS idx_player_tournaments_tournament_id ON player_tournaments("tournamentId");
        END IF;
    END IF;
END $$;

-- Indexes for game_participations table (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_participations') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_participations' AND column_name = 'gameId') THEN
            CREATE INDEX IF NOT EXISTS idx_game_participations_game_id ON game_participations("gameId");
        END IF;
    END IF;
END $$;
