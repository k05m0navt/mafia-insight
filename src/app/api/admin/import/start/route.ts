import { NextRequest, NextResponse } from 'next/server';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { importOrchestrator } from '@/lib/gomafia/import/orchestrator';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';
import { prisma as db, prisma } from '@/lib/db';
import { z } from 'zod';
import { resilientDB } from '@/lib/db-resilient';

// Strategy to Phase mapping
import { ClubsPhase } from '@/lib/gomafia/import/phases/clubs-phase';
import { PlayersPhase } from '@/lib/gomafia/import/phases/players-phase';
import { TournamentsPhase } from '@/lib/gomafia/import/phases/tournaments-phase';
import { GamesPhase } from '@/lib/gomafia/import/phases/games-phase';
import { PlayerYearStatsPhase } from '@/lib/gomafia/import/phases/player-year-stats-phase';
import { PlayerTournamentPhase } from '@/lib/gomafia/import/phases/player-tournament-phase';
import { JudgesPhase } from '@/lib/gomafia/import/phases/judges-phase';

/**
 * Global map of AbortControllers for import cancellation.
 * Keyed by importId to allow per-import cancellation.
 */
const importControllers = new Map<string, AbortController>();

/**
 * Get or create AbortController for an import.
 */
function getImportController(importId: string): AbortController {
  let controller = importControllers.get(importId);
  if (!controller) {
    controller = new AbortController();
    importControllers.set(importId, controller);
  }
  return controller;
}

/**
 * Remove AbortController for an import after completion/failure.
 */
function removeImportController(importId: string): void {
  importControllers.delete(importId);
}

/**
 * Get AbortController for an import to trigger cancellation.
 * Exported for use in cancelImport service.
 */
export function getAbortController(
  importId: string
): AbortController | undefined {
  return importControllers.get(importId);
}

const requestSchema = z.object({
  strategy: z.enum([
    'players',
    'clubs',
    'tournaments',
    'games',
    'player_stats',
    'tournament_results',
    'judges',
  ]),
});

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;

  try {
    const body = await request.json();
    const { strategy } = requestSchema.parse(body);

    // Create advisory lock manager
    const lockManager = new AdvisoryLockManager(db);

    // Try to acquire lock
    const lockAcquired = await lockManager.acquireLock();
    if (!lockAcquired) {
      return NextResponse.json(
        { error: 'Import already in progress', code: 'ADVISORY_LOCK_HELD' },
        { status: 409 }
      );
    }

    // Launch browser for scraping
    browser = await chromium.launch({ headless: true });

    // Create ImportOrchestrator (7-phase) with browser
    const orchestrator = new ImportOrchestrator(db, browser);

    // Get corresponding Phase class for strategy
    const PhaseClass = getPhaseClass(strategy);
    if (!PhaseClass) {
      throw new Error(`Unknown strategy: ${strategy}`);
    }

    // Create phase instance
    const phase = new PhaseClass(orchestrator);

    // Start progress tracking in ImportOrchestrator (singleton)
    // Use 0 as initial totalRecords - will be updated as scraping progresses
    const importId = await importOrchestrator.startImport(strategy, 0);

    // Mark as RUNNING immediately
    await importOrchestrator.updateProgress(importId, 0, 0);

    // For games strategy, start polling immediately to catch initial syncStatus updates
    if (strategy === 'games') {
      // Trigger immediate progress check (games phase updates syncStatus quickly)
      setTimeout(async () => {
        try {
          const syncStatus = (await resilientDB.execute((db) =>
            db.syncStatus.findUnique({
              where: { id: 'current' },
            })
          )) as {
            isRunning: boolean;
            totalRecordsProcessed: number | null;
            validRecords: number | null;
            invalidRecords: number | null;
          } | null;

          if (
            syncStatus &&
            syncStatus.isRunning &&
            syncStatus.totalRecordsProcessed &&
            syncStatus.totalRecordsProcessed > 0
          ) {
            await importOrchestrator.updateProgress(
              importId,
              syncStatus.validRecords || 0,
              syncStatus.invalidRecords || 0,
              syncStatus.totalRecordsProcessed
            );
          }
        } catch (_error) {
          // Silently ignore - polling will catch it
        }
      }, 1000); // Check after 1 second
    }

    // Get or create AbortController for cancellation
    const abortController = getImportController(importId);

    // Set cancellation signal on orchestrator for graceful shutdown
    orchestrator.setCancellationSignal(abortController.signal);
    console.log(`[AdminImport] Created AbortController for import ${importId}`);

    // Execute phase in background (non-blocking)
    // Note: executePhaseInBackground handles its own error cleanup
    executePhaseInBackground(
      phase,
      importId,
      lockManager,
      browser,
      orchestrator
    ).catch((error) => {
      // Log the error but don't call failImport again
      // executePhaseInBackground already handles cleanup
      console.error(
        `[AdminImport] Background phase execution error (already handled):`,
        error
      );
    });

    return NextResponse.json({
      importId,
      message: `Import started for strategy: ${strategy}`,
    });
  } catch (error) {
    console.error('Error starting admin import:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    // Clean up browser if launched
    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      {
        error: 'Failed to start import',
        details: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

function getPhaseClass(strategy: string) {
  const map = {
    players: PlayersPhase,
    clubs: ClubsPhase,
    tournaments: TournamentsPhase,
    games: GamesPhase,
    player_stats: PlayerYearStatsPhase,
    tournament_results: PlayerTournamentPhase,
    judges: JudgesPhase,
  };
  return map[strategy as keyof typeof map];
}

interface PhaseInstance {
  execute(): Promise<void>;
}

async function executePhaseInBackground(
  phase: PhaseInstance,
  importId: string,
  lockManager: AdvisoryLockManager,
  browser: Browser,
  orchestrator: ImportOrchestrator
): Promise<void> {
  const progressInterval = setInterval(async () => {
    try {
      // Always check syncStatus first (games phase updates this directly)
      const syncStatus = (await resilientDB.execute((db) =>
        db.syncStatus.findUnique({
          where: { id: 'current' },
        })
      )) as {
        isRunning: boolean;
        totalRecordsProcessed: number | null;
        validRecords: number | null;
        invalidRecords: number | null;
        currentOperation: string | null;
      } | null;

      // Check if we're in games phase by looking at checkpoint or currentOperation
      const checkpoint = (await resilientDB.execute((db) =>
        db.importCheckpoint.findUnique({
          where: { id: 'current' },
        })
      )) as { progress: number; currentPhase: string } | null;

      const isGamesPhase =
        checkpoint?.currentPhase === 'GAMES' ||
        syncStatus?.currentOperation?.toLowerCase().includes('games') ||
        syncStatus?.currentOperation?.toLowerCase().includes('tournament');

      // For games phase, syncStatus contains actual tournament counts
      // Check if we have syncStatus with tournament counts (games phase)
      // OR if we're in games phase but syncStatus hasn't initialized yet (wait for it)
      if (
        syncStatus &&
        syncStatus.isRunning &&
        (isGamesPhase ||
          (syncStatus.totalRecordsProcessed &&
            syncStatus.totalRecordsProcessed > 0))
      ) {
        // For games phase, we MUST use syncStatus values - checkpoint is wrong (shows 100% = 100 records)
        // If syncStatus hasn't initialized totalRecordsProcessed yet, wait (don't use checkpoint)
        if (
          isGamesPhase &&
          (!syncStatus.totalRecordsProcessed ||
            syncStatus.totalRecordsProcessed === 0)
        ) {
          // Games phase hasn't initialized tournament count yet, skip this update
          return;
        }

        // Get current import progress to check if we need to force update totalRecords
        const currentProgress =
          await importOrchestrator.getImportFromDB(importId);

        // If current totalRecords differs from syncStatus, we need to force update it.
        // For games phase, syncStatus.totalRecordsProcessed is the source of truth (tournament count).
        // The updateProgress method only increases totalRecords, so if it was incorrectly set
        // (e.g., 2610 games instead of 2470 tournaments), we need to correct it downward.
        const needsForceUpdate =
          syncStatus.totalRecordsProcessed &&
          syncStatus.totalRecordsProcessed > 0 &&
          currentProgress &&
          currentProgress.totalRecords !== syncStatus.totalRecordsProcessed;

        if (needsForceUpdate && syncStatus.totalRecordsProcessed) {
          // Force update by directly updating the database record
          const calculatedProgress = Math.min(
            100,
            Math.round(
              ((syncStatus.validRecords || 0) /
                syncStatus.totalRecordsProcessed) *
                100
            )
          );

          await prisma.importProgress.update({
            where: { id: importId },
            data: {
              totalRecords: syncStatus.totalRecordsProcessed,
              processedRecords: syncStatus.validRecords || 0,
              errors: syncStatus.invalidRecords || 0,
              progress: calculatedProgress,
            },
          });

          // Also update in-memory and trigger notification
          const memProgress = importOrchestrator.getImport(importId);
          if (memProgress) {
            memProgress.totalRecords = syncStatus.totalRecordsProcessed;
            memProgress.processedRecords = syncStatus.validRecords || 0;
            memProgress.errors = syncStatus.invalidRecords || 0;
            memProgress.progress = calculatedProgress;

            // Manually trigger notifyProgress to update terminal output
            // We need to access the private method, so we'll call updateProgress with same values
            // to trigger the notification (it will see totals match and update progress only)
            await importOrchestrator.updateProgress(
              importId,
              syncStatus.validRecords || 0,
              syncStatus.invalidRecords || 0
              // Don't pass totalRecords - it's already updated above
            );
          }
        } else if (syncStatus.totalRecordsProcessed) {
          // Normal update path - updateProgress will increase totalRecords if needed
          await importOrchestrator.updateProgress(
            importId,
            syncStatus.validRecords || 0,
            syncStatus.invalidRecords || 0,
            syncStatus.totalRecordsProcessed
          );
        }
      } else {
        // Fallback: Get metrics from orchestrator to track progress
        // NOTE: For games phase, NEVER use metrics.totalFetched as it counts GAMES, not TOURNAMENTS
        // Games phase should always use syncStatus.totalRecordsProcessed (tournament count)
        const metrics = orchestrator.getValidationMetrics();

        // Check if we have any progress to report
        // Only use metrics fallback if we're NOT in games phase
        if (metrics.totalFetched > 0 && !isGamesPhase) {
          // We have data scraped, update progress based on metrics
          // totalFetched = total items to process (set at start)
          // validRecords = items actually processed (updated incrementally)
          // For player_stats: totalFetched = total players, validRecords = processed players
          const processedRecords = metrics.validRecords || 0;
          await importOrchestrator.updateProgress(
            importId,
            processedRecords,
            0,
            metrics.totalFetched
          );
        } else {
          // Final fallback: Read progress from ImportCheckpoint (for other phases)
          // NOTE: Never use checkpoint fallback for games phase - it uses batch progress (0-100%)
          // which gets incorrectly converted to 100/100 records. Games phase should always
          // use syncStatus.totalRecordsProcessed and syncStatus.validRecords.
          // Only use checkpoint fallback if it's NOT games phase
          if (checkpoint && checkpoint.progress > 0 && !isGamesPhase) {
            // Use checkpoint progress percentage (batch processing phase)
            const totalRecords = 100; // Estimated for checkpoint-based progress
            const processedRecords = Math.round(
              (checkpoint.progress / 100) * totalRecords
            );

            // Update importOrchestrator for UI display
            await importOrchestrator.updateProgress(
              importId,
              processedRecords,
              0,
              totalRecords
            );
          }
        }
      }
    } catch (error) {
      // Suppress errors for cancelled/deleted imports - don't spam logs
      if (error instanceof Error && error.message.includes('not found')) {
        // Import was cancelled/deleted, silently stop polling
        clearInterval(progressInterval);
        return;
      }
      console.error('[AdminImport] Failed to update progress:', error);
    }
  }, 2000); // Poll every 2 seconds

  try {
    // Execute phase
    await phase.execute();

    // Clear progress polling interval BEFORE marking as completed
    // to prevent race condition where interval overwrites status
    clearInterval(progressInterval);

    // Mark as completed (completeImport sets progress to 100 and final metrics)
    await importOrchestrator.completeImport(importId);

    console.log(`[AdminImport] Import ${importId} completed successfully`);
  } catch (error) {
    // Check if cancellation was the cause
    if (orchestrator.isCancelled()) {
      console.log(`[AdminImport] Import ${importId} was cancelled gracefully`);
    } else {
      console.error(`[AdminImport] Import ${importId} failed:`, error);
    }
    // Clear interval on error too
    clearInterval(progressInterval);
    await importOrchestrator.failImport(importId);
    throw error;
  } finally {
    // Remove AbortController from map
    removeImportController(importId);

    // Always clean up browser and release lock with error handling
    try {
      if (browser) {
        await browser.close();
      }
    } catch (cleanupError) {
      console.error('[AdminImport] Browser cleanup error:', cleanupError);
    }

    try {
      await lockManager.releaseLock();
    } catch (cleanupError) {
      console.error('[AdminImport] Lock release error:', cleanupError);
    }
  }
}
