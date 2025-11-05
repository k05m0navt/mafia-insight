import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Cache for database emptiness check to avoid repeated queries
let isEmptyCache: { isEmpty: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

/**
 * Auto-trigger import if database is empty.
 *
 * This function should be called from API routes that require data
 * (e.g., /api/players, /api/games) to automatically trigger import
 * on first access.
 *
 * Uses caching to avoid repeated database checks on every request.
 *
 * @returns true if import was triggered, false otherwise
 */
export async function autoTriggerImportIfNeeded(): Promise<boolean> {
  try {
    // Check cache first (only if cache is recent)
    const now = Date.now();
    if (isEmptyCache && now - isEmptyCache.timestamp < CACHE_DURATION) {
      // If cache says not empty, skip the check
      if (!isEmptyCache.isEmpty) {
        return false;
      }
      // If cache says empty, we still need to check if import is running
    }

    // Check if import is already running
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    if (syncStatus?.isRunning) {
      console.log(
        '[AutoTrigger] Import already running, skipping auto-trigger'
      );
      return false;
    }

    // Check if database is empty (only if cache expired or import not running)
    const [playerCount, gameCount] = await Promise.all([
      db.player.count(),
      db.game.count(),
    ]);

    const isEmpty = playerCount === 0 && gameCount === 0;

    // Update cache
    isEmptyCache = { isEmpty, timestamp: now };

    if (!isEmpty) {
      console.log(
        `[AutoTrigger] Database not empty (${playerCount} players, ${gameCount} games), skipping auto-trigger`
      );
      return false;
    }

    console.log(
      '[AutoTrigger] Database is empty, triggering initial import...'
    );

    // Trigger import by making internal API call
    // In a production environment, you might want to use a job queue instead
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/gomafia-sync/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ autoTriggered: true }),
    });

    if (response.ok) {
      console.log('[AutoTrigger] Initial import triggered successfully');
      return true;
    } else {
      const error = await response.json();
      console.error('[AutoTrigger] Failed to trigger import:', error);
      return false;
    }
  } catch (error) {
    console.error('[AutoTrigger] Auto-trigger failed:', error);
    return false;
  }
}

/**
 * Check if database is empty.
 * Utility function for manual checks.
 */
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const [playerCount, gameCount] = await Promise.all([
      db.player.count(),
      db.game.count(),
    ]);

    return playerCount === 0 && gameCount === 0;
  } catch (error) {
    console.error('[AutoTrigger] Failed to check if database is empty:', error);
    return false;
  }
}

/**
 * Get database statistics.
 */
export async function getDatabaseStats() {
  try {
    const [playerCount, clubCount, tournamentCount, gameCount] =
      await Promise.all([
        db.player.count(),
        db.club.count(),
        db.tournament.count(),
        db.game.count(),
      ]);

    return {
      players: playerCount,
      clubs: clubCount,
      tournaments: tournamentCount,
      games: gameCount,
      isEmpty: playerCount === 0 && gameCount === 0,
    };
  } catch (error) {
    console.error('[AutoTrigger] Failed to get database stats:', error);
    return {
      players: 0,
      clubs: 0,
      tournaments: 0,
      games: 0,
      isEmpty: true,
    };
  }
}
