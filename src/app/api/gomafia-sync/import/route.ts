import { NextResponse } from 'next/server';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';
import { prisma as db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';
import { Prisma } from '@prisma/client';

/**
 * Global AbortController for import cancellation.
 * Allows DELETE endpoint to signal cancellation to running import.
 * Pattern inspired by p-queue's AbortController usage for graceful cancellation.
 */
let currentImportController: AbortController | null = null;

/**
 * GET /api/gomafia-sync/import
 * Get current import status with progress and metrics
 */
export async function GET() {
  try {
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    const syncLog = await db.syncLog.findFirst({
      where: { status: 'RUNNING' },
      orderBy: { startTime: 'desc' },
    });

    // Get record counts for summary
    const [playerCount, clubCount, gameCount, tournamentCount] =
      await Promise.all([
        db.player.count(),
        db.club.count(),
        db.game.count(),
        db.tournament.count(),
      ]);

    const response = NextResponse.json({
      isRunning: syncStatus?.isRunning || false,
      progress: syncStatus?.progress || 0,
      currentOperation: syncStatus?.currentOperation || null,
      lastSyncTime: syncStatus?.lastSyncTime?.toISOString() || null,
      lastSyncType: syncStatus?.lastSyncType || null,
      lastError: syncStatus?.lastError || null,
      syncLogId: syncLog?.id || null,
      // Map validRecords/totalRecordsProcessed to processedRecords/totalRecords for UI compatibility
      // For games phase, these represent tournaments processed/total tournaments
      processedRecords: syncStatus?.validRecords || 0,
      totalRecords: syncStatus?.totalRecordsProcessed || 0,
      validation: {
        validationRate: syncStatus?.validationRate || null,
        totalRecordsProcessed: syncStatus?.totalRecordsProcessed || null,
        validRecords: syncStatus?.validRecords || null,
        invalidRecords: syncStatus?.invalidRecords || null,
      },
      summary: {
        players: playerCount,
        clubs: clubCount,
        games: gameCount,
        tournaments: tournamentCount,
      },
    });

    // Prevent caching to ensure fresh data
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: unknown) {
    console.error('Failed to fetch import status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch import status',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gomafia-sync/import
 * Trigger initial data import from gomafia.pro
 */
export async function POST(request: Request) {
  const lockManager = new AdvisoryLockManager(db);

  try {
    // Try to acquire advisory lock
    const acquired = await lockManager.acquireLock();

    if (!acquired) {
      // Another import is already running
      const status = await db.syncStatus.findUnique({
        where: { id: 'current' },
      });

      return NextResponse.json(
        {
          error: 'Import operation already in progress',
          code: 'IMPORT_RUNNING',
          details: {
            progress: status?.progress || 0,
            currentOperation: status?.currentOperation || 'Unknown',
          },
        },
        { status: 409 }
      );
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const forceRestart = body.forceRestart || false;

    // Create sync log entry
    const syncLog = await db.syncLog.create({
      data: {
        type: 'FULL',
        status: 'RUNNING',
        startTime: new Date(),
      },
    });

    // Initialize sync status
    await db.syncStatus.upsert({
      where: { id: 'current' },
      update: {
        isRunning: true,
        progress: 0,
        currentOperation: 'Initializing import...',
        lastError: null,
        updatedAt: new Date(),
      },
      create: {
        id: 'current',
        isRunning: true,
        progress: 0,
        currentOperation: 'Initializing import...',
      },
    });

    // Create AbortController for cancellation support
    currentImportController = new AbortController();
    console.log('[API] Created AbortController for import cancellation');

    // Start import in background (don't await)
    // In a real implementation, this would call ImportOrchestrator
    // For now, we'll simulate the structure
    startImportInBackground(
      syncLog.id,
      forceRestart,
      lockManager,
      currentImportController.signal
    ).catch(async (error) => {
      console.error('Import failed:', error);

      // Update sync log with error
      await db.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          endTime: new Date(),
          errors: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error.stack,
          },
        },
      });

      // Update sync status
      await db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Clear controller and release lock
      currentImportController = null;
      await lockManager.releaseLock();
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Initial import started successfully',
        syncLogId: syncLog.id,
        estimatedDuration: '3-4 hours',
        note: 'Import is running in the background. Check status via GET /api/gomafia-sync/sync/status',
      },
      { status: 202 }
    );
  } catch (error: unknown) {
    console.error('Import trigger failed:', error);

    // Ensure lock is released on error
    try {
      await lockManager.releaseLock();
    } catch (releaseError) {
      console.error('Failed to release lock:', releaseError);
    }

    return NextResponse.json(
      {
        error: 'Failed to trigger import',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gomafia-sync/import
 * Cancel running import gracefully using AbortController.
 *
 * Pattern inspired by p-queue's AbortSignal cancellation:
 * - Aborts the controller signal
 * - Allows in-progress operations to complete gracefully
 * - Saves checkpoint for resume capability
 */
export async function DELETE() {
  try {
    const status = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    if (!status?.isRunning) {
      return NextResponse.json(
        {
          error: 'No import operation is currently running',
          code: 'NO_IMPORT_RUNNING',
        },
        { status: 404 }
      );
    }

    // Abort the import via AbortController
    if (currentImportController) {
      console.log('[API] Sending cancellation signal to import...');
      currentImportController.abort('User requested cancellation');

      // Update UI immediately to show cancellation in progress
      await db.syncStatus.update({
        where: { id: 'current' },
        data: {
          currentOperation: 'Cancelling import... (saving checkpoint)',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message:
          'Import cancellation requested. Saving checkpoint for resume capability.',
      });
    } else {
      // No controller available (shouldn't happen if import is running)
      console.warn('[API] No AbortController found for running import');

      // Fallback: just update status
      await db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: false,
          lastError: 'Import cancelled by user (no controller)',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Import cancellation requested (fallback mode).',
      });
    }
  } catch (error: unknown) {
    console.error('Import cancellation failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel import',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Background import execution using ImportOrchestrator with cancellation support.
 *
 * @param syncLogId The sync log ID for tracking
 * @param forceRestart Whether to force restart (ignore checkpoint)
 * @param lockManager The advisory lock manager
 * @param cancellationSignal AbortSignal for graceful cancellation
 */
async function startImportInBackground(
  syncLogId: string,
  _forceRestart: boolean,
  lockManager: AdvisoryLockManager,
  cancellationSignal: AbortSignal
): Promise<void> {
  const { chromium } = await import('playwright');
  const { ImportOrchestrator } = await import(
    '@/lib/gomafia/import/import-orchestrator'
  );
  const { ClubsPhase } = await import(
    '@/lib/gomafia/import/phases/clubs-phase'
  );
  const { PlayersPhase } = await import(
    '@/lib/gomafia/import/phases/players-phase'
  );

  let browser;

  try {
    console.log(
      `[Import] Starting background import (syncLogId: ${syncLogId})`
    );

    // Launch browser for scraping
    browser = await chromium.launch({ headless: true });

    // Create orchestrator
    const orchestrator = new ImportOrchestrator(db, browser);

    // Set cancellation signal for graceful shutdown
    orchestrator.setCancellationSignal(cancellationSignal);
    console.log('[Import] Cancellation signal configured');

    // Import all phase implementations
    const { PlayerYearStatsPhase } = await import(
      '@/lib/gomafia/import/phases/player-year-stats-phase'
    );
    const { TournamentsPhase } = await import(
      '@/lib/gomafia/import/phases/tournaments-phase'
    );
    const { PlayerTournamentPhase } = await import(
      '@/lib/gomafia/import/phases/player-tournament-phase'
    );
    const { GamesPhase } = await import(
      '@/lib/gomafia/import/phases/games-phase'
    );
    const { StatisticsPhase } = await import(
      '@/lib/gomafia/import/phases/statistics-phase'
    );

    // Import club members phase
    const { ClubMembersPhase } = await import(
      '@/lib/gomafia/import/phases/club-members-phase'
    );
    // Import tournament chief judge phase
    const { TournamentChiefJudgePhase } = await import(
      '@/lib/gomafia/import/phases/tournament-chief-judge-phase'
    );
    // Import judges phase
    const { JudgesPhase } = await import(
      '@/lib/gomafia/import/phases/judges-phase'
    );

    // Execute all 10 phases
    const phases = [
      { name: 'CLUBS', phase: new ClubsPhase(orchestrator) },
      { name: 'PLAYERS', phase: new PlayersPhase(orchestrator) },
      { name: 'CLUB_MEMBERS', phase: new ClubMembersPhase(orchestrator) },
      {
        name: 'PLAYER_YEAR_STATS',
        phase: new PlayerYearStatsPhase(orchestrator),
      },
      { name: 'TOURNAMENTS', phase: new TournamentsPhase(orchestrator) },
      {
        name: 'TOURNAMENT_CHIEF_JUDGE',
        phase: new TournamentChiefJudgePhase(orchestrator),
      },
      {
        name: 'PLAYER_TOURNAMENT_HISTORY',
        phase: new PlayerTournamentPhase(orchestrator),
      },
      { name: 'JUDGES', phase: new JudgesPhase(orchestrator) },
      { name: 'GAMES', phase: new GamesPhase(orchestrator) },
      { name: 'STATISTICS', phase: new StatisticsPhase(orchestrator) },
    ];

    for (let i = 0; i < phases.length; i++) {
      // Check for cancellation before each phase
      if (orchestrator.isCancelled()) {
        console.log(
          '[Import] Cancellation detected, calling orchestrator.cancel()...'
        );
        await orchestrator.cancel();

        // Clear the global controller
        currentImportController = null;
        return; // Exit gracefully
      }

      const { name, phase } = phases[i];
      // Calculate phase start progress (not completion progress)
      // Phase i starts at (i / totalPhases * 100)%
      const phaseStartProgress = Math.floor((i / phases.length) * 100);

      console.log(`[Import] Starting phase ${i + 1}/${phases.length}: ${name}`);

      await resilientDB.execute((db) =>
        db.syncStatus.update({
          where: { id: 'current' },
          data: {
            isRunning: true, // Ensure isRunning stays true during phases
            progress: phaseStartProgress,
            currentOperation: `Executing ${name} phase`,
            updatedAt: new Date(),
          },
        })
      );

      // Execute phase (may throw if cancelled during execution)
      try {
        await phase.execute();
        console.log(`[Import] Completed phase: ${name}`);
      } catch (error: unknown) {
        // Check if it's a cancellation error
        if (
          error instanceof Error
            ? error.message
            : 'Unknown error'?.includes('cancelled')
        ) {
          console.log(
            '[Import] Phase cancelled, calling orchestrator.cancel()...'
          );
          await orchestrator.cancel();

          // Clear the global controller
          currentImportController = null;
          return; // Exit gracefully
        }
        // Otherwise, re-throw
        throw error;
      }
    }

    // Get final metrics and skipped pages
    const metrics = orchestrator.getValidationMetrics();
    const skippedPages = orchestrator.getSkippedPagesForStorage();

    // Prepare error data including skipped pages
    const errorData: Record<string, unknown> = {};
    if (Object.keys(skippedPages).length > 0) {
      errorData.skippedPages = skippedPages;
    }

    // Mark as completed
    await db.syncLog.update({
      where: { id: syncLogId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        recordsProcessed: metrics.validRecords,
        errors:
          Object.keys(errorData).length > 0
            ? (errorData as Prisma.InputJsonValue)
            : undefined,
      },
    });

    await db.syncStatus.update({
      where: { id: 'current' },
      data: {
        isRunning: false,
        progress: 100,
        currentOperation: null,
        lastSyncTime: new Date(),
        lastSyncType: 'FULL',
      },
    });

    console.log('[Import] Import completed successfully');

    // Clear the global controller
    currentImportController = null;
  } catch (error: unknown) {
    console.error('[Import] Import failed:', error);

    // Mark as failed
    await db.syncLog.update({
      where: { id: syncLogId },
      data: {
        status: 'FAILED',
        endTime: new Date(),
        errors: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
    });

    await db.syncStatus.update({
      where: { id: 'current' },
      data: {
        isRunning: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    // Clear the global controller on error
    currentImportController = null;

    throw error;
  } finally {
    // Always release lock and close browser
    if (browser) {
      await browser.close();
    }
    await lockManager.releaseLock();
  }
}
