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
// import { logSyncError } from '@/lib/errorTracking/syncErrors';

// Configuration
const BATCH_SIZE = parseInt(process.env.SYNC_BATCH_SIZE || '100');
const MAX_RETRIES = parseInt(process.env.SYNC_MAX_RETRIES || '3');
const RETRY_DELAY = parseInt(process.env.SYNC_RETRY_DELAY || '1000');

// Helper function to retry individual operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 100
): Promise<T> {
  let lastError: Error;
  
  // Permanent errors that should not be retried
  const isPermanentError = (error: Error): boolean => {
    const permanentErrorPatterns = [
      /not found/i,
      /invalid/i,
      /unauthorized/i,
      /forbidden/i,
    ];
    return permanentErrorPatterns.some(pattern => pattern.test(error.message));
  };
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry permanent errors
      if (isPermanentError(lastError)) {
        throw lastError;
      }
      
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError!;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  validCount: number;
  invalidCount: number;
  partialDataCount: number;
  emptyDataCount: number;
  retryCount: number;
  errors: string[];
  duration: number;
}

export interface SyncOptions {
  type: 'FULL' | 'INCREMENTAL';
  batchSize?: number;
  maxRetries?: number;
  skipSyncLogCreation?: boolean;
}

// Main sync job orchestrator
export async function runSync(options: SyncOptions): Promise<SyncResult> {
  const startTime = Date.now();
  let syncLogId: string | undefined;
  let recordsProcessed = 0;
  const errors: string[] = [];

  // Create sync log entry (unless skipped by retry wrapper)
  if (!options.skipSyncLogCreation) {
    const syncLog = await db.syncLog.create({
      data: {
        type: options.type,
        status: 'RUNNING',
        startTime: new Date(),
      },
    });
    syncLogId = syncLog.id;
  }

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
  let result;
  if (options.type === 'FULL') {
    result = await runFullSync();
  } else {
    result = await runIncrementalSync();
  }
  
  recordsProcessed = result.recordsProcessed;
  errors.push(...result.errors);

  // Update sync log with completion (unless skipped by retry wrapper)
  if (!options.skipSyncLogCreation && syncLogId) {
    await db.syncLog.update({
      where: { id: syncLogId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        recordsProcessed,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  }

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
  
  // Cleanup browser resources
  await cleanup();
  
  return {
    success: true,
    recordsProcessed,
    validCount: recordsProcessed,
    invalidCount: 0,
    partialDataCount: 0,
    emptyDataCount: 0,
    retryCount: 0,
    errors,
    duration,
  };
}

// Full sync implementation
export async function runFullSync(): Promise<{
  recordsProcessed: number;
  errors: string[];
}> {
  let recordsProcessed = 0;
  const errors: string[] = [];

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
        // Use retry logic for individual player parsing
        const playerData = await retryOperation(() => parsePlayer(playerSummary.id));

        if (!validatePlayerData(playerData)) {
          errors.push(`Invalid player data for ${playerSummary.id}`);
          continue;
        }

        const transformedData = transformPlayerData(playerData);

        // Use retry logic for database operations
        await retryOperation(() => db.player.upsert({
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
        }));

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
}

// Incremental sync implementation
export async function runIncrementalSync(): Promise<{
  recordsProcessed: number;
  errors: string[];
}> {
  let recordsProcessed = 0;
  const errors: string[] = [];

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
        if (
          !hasPlayerDataChanged(
            {
              ...existingPlayer,
              lastSyncAt: existingPlayer.lastSyncAt ?? undefined,
              syncStatus: existingPlayer.syncStatus ?? undefined,
              clubId: existingPlayer.clubId ?? undefined,
            },
            playerData
          )
        ) {
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
}

// Retry logic wrapper
export async function runSyncWithRetry(
  type: 'FULL' | 'INCREMENTAL',
  maxRetries: number = MAX_RETRIES
): Promise<SyncResult> {
  let lastError: Error;
  let syncLogId: string | undefined;
  const retryErrors: Array<{ attempt: number; error: string }> = [];
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Sync attempt ${attempt + 1} of ${maxRetries}`);
      
      // Create sync log entry on first attempt
      if (attempt === 0) {
        const syncLog = await db.syncLog.create({
          data: {
            type,
            status: 'RUNNING',
            startTime: new Date(),
          },
        });
        syncLogId = syncLog.id;
      }
      
      const result = await runSync({ type, skipSyncLogCreation: true });
      
      // Update the sync log with the final result and retry errors
      if (syncLogId) {
        await db.syncLog.update({
          where: { id: syncLogId },
          data: {
            status: 'COMPLETED',
            endTime: new Date(),
            recordsProcessed: result.recordsProcessed,
            errors: retryErrors.length > 0 ? retryErrors : undefined,
          },
        });
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.log(`Sync attempt ${attempt + 1} failed:`, lastError.message);
      
      // Track retry errors
      retryErrors.push({
        attempt: attempt + 1,
        error: lastError.message,
      });

      if (attempt < maxRetries - 1) {
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        console.log(
          `Sync attempt ${attempt + 1} failed, retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.log(`All ${maxRetries} sync attempts failed`);
  
  // Update sync log with failure
  if (syncLogId) {
    await db.syncLog.update({
      where: { id: syncLogId },
      data: {
        status: 'FAILED',
        endTime: new Date(),
        recordsProcessed: 0,
        errors: retryErrors,
      },
    });
  }
  
  // Return a failed result instead of throwing
  return {
    success: false,
    recordsProcessed: 0,
    validCount: 0,
    invalidCount: 0,
    partialDataCount: 0,
    emptyDataCount: 0,
    retryCount: maxRetries,
    errors: [lastError!.message],
    duration: Date.now() - startTime,
  };
}
