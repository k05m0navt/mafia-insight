-- Add index for role-based metrics queries
-- Migration: add_role_metrics_indexes
-- Date: December 5, 2025
-- Purpose: Optimize role-based analytics queries for performance

-- Index for Game queries filtered by date and status (for date range filtering)
-- This supports filtering participations by game date and status
CREATE INDEX IF NOT EXISTS "games_date_status_idx" ON "games" ("date", "status") 
WHERE "status" = 'COMPLETED';
