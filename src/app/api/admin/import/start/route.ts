import { NextRequest, NextResponse } from 'next/server';
import { chromium, Browser } from 'playwright';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { importOrchestrator } from '@/lib/gomafia/import/orchestrator';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';
import { prisma as db } from '@/lib/db';
import { z } from 'zod';
import { resilientDB } from '@/lib/db-resilient';

// Strategy to Phase mapping
import { ClubsPhase } from '@/lib/gomafia/import/phases/clubs-phase';
import { PlayersPhase } from '@/lib/gomafia/import/phases/players-phase';
import { TournamentsPhase } from '@/lib/gomafia/import/phases/tournaments-phase';
import { GamesPhase } from '@/lib/gomafia/import/phases/games-phase';
import { PlayerYearStatsPhase } from '@/lib/gomafia/import/phases/player-year-stats-phase';
import { PlayerTournamentPhase } from '@/lib/gomafia/import/phases/player-tournament-phase';

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
      // Get metrics from orchestrator to track progress
      const metrics = orchestrator.getValidationMetrics();

      // Check if we have any progress to report
      if (metrics.totalFetched > 0) {
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
        // Read progress from ImportCheckpoint (updated by phases during batch processing)
        const checkpoint = await resilientDB.execute((db) =>
          db.importCheckpoint.findUnique({
            where: { id: 'current' },
          })
        );

        if (checkpoint && checkpoint.progress > 0) {
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
