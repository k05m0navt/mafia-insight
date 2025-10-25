import { db } from '@/lib/db';
import {
  parsePlayerList,
  parsePlayer,
  cleanup,
} from '@/lib/parsers/gomafiaParser';
import {
  transformPlayerData,
  validatePlayerData,
  hasPlayerDataChanged,
} from '@/lib/parsers/transformPlayer';
import { logSyncError } from '@/lib/errorTracking/syncErrors';

// Configuration
const BATCH_SIZE = parseInt(process.env.SYNC_BATCH_SIZE || '100');
const MAX_RETRIES = parseInt(process.env.SYNC_MAX_RETRIES || '5');
const RETRY_DELAY = parseInt(process.env.SYNC_RETRY_DELAY || '1000');

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
}

export interface SyncOptions {
  type: 'FULL' | 'INCREMENTAL';
  batchSize?: number;
  maxRetries?: number;
}

// Main sync job orchestrator
export async function runSync(options: SyncOptions): Promise<SyncResult> {
  const startTime = Date.now();
  let syncLogId: string;
  let recordsProcessed = 0;
  const errors: string[] = [];

  try {
    // Create sync log entry
    const syncLog = await db.syncLog.create({
      data: {
        type: options.type,
        status: 'RUNNING',
        startTime: new Date(),
      },
    });
    syncLogId = syncLog.id;

    // Update sync status
    await db.syncStatus.upsert({
      where: { id: 'current' },
      update: {
        isRunning: true,
        progress: 0,
        currentOperation: `Starting ${options.type} sync`,
        lastError: null,
      },
      create: {
        id: 'current',
        isRunning: true,
        progress: 0,
        currentOperation: `Starting ${options.type} sync`,
      },
    });

    // Run the appropriate sync type
    if (options.type === 'FULL') {
      const result = await runFullSync(options);
      recordsProcessed = result.recordsProcessed;
      errors.push(...result.errors);
    } else {
      const result = await runIncrementalSync(options);
      recordsProcessed = result.recordsProcessed;
      errors.push(...result.errors);
    }

    // Update sync log with completion
    await db.syncLog.update({
      where: { id: syncLogId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        recordsProcessed,
        errors: errors.length > 0 ? errors : null,
      },
    });

    // Update sync status
    await db.syncStatus.upsert({
      where: { id: 'current' },
      update: {
        lastSyncTime: new Date(),
        lastSyncType: options.type,
        isRunning: false,
        progress: 100,
        currentOperation: null,
        lastError: null,
      },
      create: {
        id: 'current',
        lastSyncTime: new Date(),
        lastSyncType: options.type,
        isRunning: false,
        progress: 100,
      },
    });

    const duration = Date.now() - startTime;
    return {
      success: true,
      recordsProcessed,
      errors,
      duration,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Log the error
    await logSyncError('sync_job', errorMessage, { syncLogId, options });

    // Update sync log with failure
    if (syncLogId) {
      await db.syncLog.update({
        where: { id: syncLogId },
        data: {
          status: 'FAILED',
          endTime: new Date(),
          recordsProcessed,
          errors: [...errors, errorMessage],
        },
      });
    }

    // Update sync status
    await db.syncStatus.upsert({
      where: { id: 'current' },
      update: {
        isRunning: false,
        progress: 0,
        currentOperation: null,
        lastError: errorMessage,
      },
      create: {
        id: 'current',
        isRunning: false,
        lastError: errorMessage,
      },
    });

    const duration = Date.now() - startTime;
    return {
      success: false,
      recordsProcessed,
      errors: [...errors, errorMessage],
      duration,
    };
  } finally {
    // Cleanup browser resources
    await cleanup();
  }
}

// Full sync implementation
export async function runFullSync(
  _options: SyncOptions
): Promise<{ recordsProcessed: number; errors: string[] }> {
  let recordsProcessed = 0;
  const errors: string[] = [];

  try {
    // Get all players from gomafia.pro
    const playerList = await parsePlayerList(1, 1000); // Get first 1000 players
    console.log(`Found ${playerList.length} players to sync`);

    // Process players in batches
    for (let i = 0; i < playerList.length; i += BATCH_SIZE) {
      const batch = playerList.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing player batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(playerList.length / BATCH_SIZE)}`
      );

      // Update progress
      const progress = Math.round((i / playerList.length) * 100);
      await db.syncStatus.upsert({
        where: { id: 'current' },
        update: {
          progress,
          currentOperation: `Processing players ${i + 1}-${Math.min(i + BATCH_SIZE, playerList.length)}`,
        },
        create: {
          id: 'current',
          progress,
          currentOperation: `Processing players ${i + 1}-${Math.min(i + BATCH_SIZE, playerList.length)}`,
        },
      });

      // Process each player in the batch
      for (const playerSummary of batch) {
        try {
          const playerData = await parsePlayer(playerSummary.id);

          if (!validatePlayerData(playerData)) {
            errors.push(`Invalid player data for ${playerSummary.id}`);
            continue;
          }

          const transformedData = transformPlayerData(playerData);

          await db.player.upsert({
            where: { gomafiaId: playerData.id },
            update: {
              name: transformedData.name,
              eloRating: transformedData.eloRating,
              totalGames: transformedData.totalGames,
              wins: transformedData.wins,
              losses: transformedData.losses,
              lastSyncAt: transformedData.lastSyncAt,
              syncStatus: transformedData.syncStatus,
            },
            create: {
              gomafiaId: transformedData.gomafiaId,
              name: transformedData.name,
              eloRating: transformedData.eloRating,
              totalGames: transformedData.totalGames,
              wins: transformedData.wins,
              losses: transformedData.losses,
              lastSyncAt: transformedData.lastSyncAt,
              syncStatus: transformedData.syncStatus,
              userId: '00000000-0000-0000-0000-000000000000', // Default user for synced players
            },
          });

          recordsProcessed++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Failed to sync player ${playerSummary.id}: ${errorMessage}`
          );
        }
      }
    }

    // TODO: Implement game syncing in a similar way
    // This would require parsing game lists and individual game data

    return { recordsProcessed, errors };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Full sync failed: ${errorMessage}`);
    return { recordsProcessed, errors };
  }
}

// Incremental sync implementation
export async function runIncrementalSync(
  _options: SyncOptions
): Promise<{ recordsProcessed: number; errors: string[] }> {
  let recordsProcessed = 0;
  const errors: string[] = [];

  try {
    // Get players that need to be synced (those with syncStatus = 'PENDING' or 'ERROR')
    const playersToSync = await db.player.findMany({
      where: {
        OR: [
          { syncStatus: 'PENDING' },
          { syncStatus: 'ERROR' },
          { lastSyncAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Older than 24 hours
        ],
      },
      take: 1000, // Limit to prevent overwhelming the system
    });

    console.log(`Found ${playersToSync.length} players to sync incrementally`);

    // Process players in batches
    for (let i = 0; i < playersToSync.length; i += BATCH_SIZE) {
      const batch = playersToSync.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing incremental batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(playersToSync.length / BATCH_SIZE)}`
      );

      // Update progress
      const progress = Math.round((i / playersToSync.length) * 100);
      await db.syncStatus.upsert({
        where: { id: 'current' },
        update: {
          progress,
          currentOperation: `Processing incremental sync ${i + 1}-${Math.min(i + BATCH_SIZE, playersToSync.length)}`,
        },
        create: {
          id: 'current',
          progress,
          currentOperation: `Processing incremental sync ${i + 1}-${Math.min(i + BATCH_SIZE, playersToSync.length)}`,
        },
      });

      // Process each player in the batch
      for (const existingPlayer of batch) {
        try {
          const playerData = await parsePlayer(existingPlayer.gomafiaId);

          if (!validatePlayerData(playerData)) {
            errors.push(`Invalid player data for ${existingPlayer.gomafiaId}`);
            continue;
          }

          // Check if data has changed
          if (!hasPlayerDataChanged(existingPlayer, playerData)) {
            // Update lastSyncAt even if no changes
            await db.player.update({
              where: { id: existingPlayer.id },
              data: {
                lastSyncAt: new Date(),
                syncStatus: 'SYNCED',
              },
            });
            recordsProcessed++;
            continue;
          }

          const transformedData = transformPlayerData(playerData);

          await db.player.update({
            where: { id: existingPlayer.id },
            data: {
              name: transformedData.name,
              eloRating: transformedData.eloRating,
              totalGames: transformedData.totalGames,
              wins: transformedData.wins,
              losses: transformedData.losses,
              lastSyncAt: transformedData.lastSyncAt,
              syncStatus: transformedData.syncStatus,
            },
          });

          recordsProcessed++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Failed to sync player ${existingPlayer.gomafiaId}: ${errorMessage}`
          );

          // Mark player as error status
          await db.player.update({
            where: { id: existingPlayer.id },
            data: {
              syncStatus: 'ERROR',
              lastSyncAt: new Date(),
            },
          });
        }
      }
    }

    return { recordsProcessed, errors };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Incremental sync failed: ${errorMessage}`);
    return { recordsProcessed, errors };
  }
}

// Retry logic wrapper
export async function runSyncWithRetry(
  type: 'FULL' | 'INCREMENTAL',
  maxRetries: number = MAX_RETRIES
): Promise<SyncResult> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await runSync({ type });
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        console.log(
          `Sync attempt ${attempt + 1} failed, retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
