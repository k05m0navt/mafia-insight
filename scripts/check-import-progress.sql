-- Check Import Progress
-- Run this in Prisma Studio's SQL query tab or Supabase SQL editor

-- 1. Check current import status
SELECT 
  "isRunning",
  progress,
  "currentOperation",
  "validationRate",
  "totalRecordsProcessed",
  "lastSyncTime",
  "updatedAt"
FROM sync_status
WHERE id = 'current';

-- 2. Count imported records by table
SELECT 'players' as table_name, COUNT(*) as count FROM players
UNION ALL
SELECT 'clubs', COUNT(*) FROM clubs
UNION ALL
SELECT 'tournaments', COUNT(*) FROM tournaments
UNION ALL
SELECT 'games', COUNT(*) FROM games
UNION ALL
SELECT 'player_year_stats', COUNT(*) FROM player_year_stats
UNION ALL
SELECT 'player_tournaments', COUNT(*) FROM player_tournaments
UNION ALL
SELECT 'game_participations', COUNT(*) FROM game_participations;

-- 3. Check latest sync log
SELECT 
  id,
  type,
  status,
  "startTime",
  "endTime",
  "recordsProcessed",
  errors
FROM sync_logs
ORDER BY "startTime" DESC
LIMIT 1;

-- 4. Check recent players (with regions)
SELECT 
  id,
  name,
  region,
  "eloRating",
  "totalGames",
  "syncStatus",
  "lastSyncAt"
FROM players
ORDER BY "lastSyncAt" DESC NULLS LAST
LIMIT 10;

-- 5. Check import progress over time
SELECT 
  "updatedAt",
  progress,
  "currentOperation",
  "validationRate"
FROM sync_status
WHERE id = 'current'
ORDER BY "updatedAt" DESC
LIMIT 5;

