-- Add indexes for sync performance optimization
-- Migration: add_sync_indexes

-- Indexes for sync_logs table
CREATE INDEX IF NOT EXISTS "idx_sync_logs_created_at" ON "sync_logs" ("createdAt");
CREATE INDEX IF NOT EXISTS "idx_sync_logs_status" ON "sync_logs" ("status");
CREATE INDEX IF NOT EXISTS "idx_sync_logs_type" ON "sync_logs" ("type");
CREATE INDEX IF NOT EXISTS "idx_sync_logs_start_time" ON "sync_logs" ("startTime");

-- Indexes for players table sync fields
CREATE INDEX IF NOT EXISTS "idx_players_last_sync_at" ON "players" ("lastSyncAt");
CREATE INDEX IF NOT EXISTS "idx_players_sync_status" ON "players" ("syncStatus");
CREATE INDEX IF NOT EXISTS "idx_players_gomafia_id" ON "players" ("gomafiaId");

-- Indexes for games table sync fields
CREATE INDEX IF NOT EXISTS "idx_games_last_sync_at" ON "games" ("lastSyncAt");
CREATE INDEX IF NOT EXISTS "idx_games_sync_status" ON "games" ("syncStatus");
CREATE INDEX IF NOT EXISTS "idx_games_gomafia_id" ON "games" ("gomafiaId");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_players_sync_status_last_sync" ON "players" ("syncStatus", "lastSyncAt");
CREATE INDEX IF NOT EXISTS "idx_games_sync_status_last_sync" ON "games" ("syncStatus", "lastSyncAt");

-- Indexes for performance monitoring
CREATE INDEX IF NOT EXISTS "idx_sync_logs_status_start_time" ON "sync_logs" ("status", "startTime");
CREATE INDEX IF NOT EXISTS "idx_sync_logs_type_status" ON "sync_logs" ("type", "status");
