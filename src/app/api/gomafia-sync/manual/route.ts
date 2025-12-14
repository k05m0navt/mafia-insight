import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { chromium } from 'playwright';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';
import { authenticateRequest } from '@/lib/apiAuth';

/**
 * POST /api/gomafia-sync/manual
 * Manually trigger incremental sync for authenticated user.
 * Returns sync summary with games imported and updated counts.
 */
export async function POST(request: NextRequest) {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  const lockManager = new AdvisoryLockManager(db);
  let userId: string | undefined;

  try {
    // Authenticate user
    const { user } = await authenticateRequest(request);
    userId = user.id;

    console.log(`[Manual Sync] User ${userId} triggered manual sync`);

    // Check for active import using AdvisoryLock (prevents concurrent syncs for same user)
    const lockAcquired = await lockManager.acquireLock(userId);
    if (!lockAcquired) {
      console.log(
        `[Manual Sync] User ${userId} has active import, returning 409 Conflict`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Sync already in progress. Please wait.',
          message: 'Sync already in progress. Please wait.',
        },
        { status: 409 }
      );
    }

    try {
      // Get user's lastSyncAt timestamp
      const userRecord = await resilientDB.execute((db) =>
        db.user.findUnique({
          where: { id: userId },
          select: { lastSyncAt: true },
        })
      );

      const lastSyncAt = userRecord?.lastSyncAt || new Date(0); // Use epoch if never synced

      // Launch browser for scraping - wrap in try-finally to ensure cleanup
      try {
        browser = await chromium.launch({ headless: true });
        const orchestrator = new ImportOrchestrator(db, browser);

        // Run incremental sync
        const result = await orchestrator.syncIncremental(userId, lastSyncAt);

        // Explicitly update lastSyncAt after successful sync (Task 6 requirement)
        // Note: syncIncremental also updates it, but making it explicit here
        if (result.success) {
          await resilientDB.execute((db) =>
            db.user.update({
              where: { id: userId },
              data: {
                lastSyncAt: new Date(),
              },
            })
          );
        }

        // Release lock
        await lockManager.releaseLock(userId);

        return NextResponse.json({
          success: result.success,
          message: 'Manual sync completed successfully',
          summary: {
            gamesImported: result.gamesImported,
            gamesUpdated: result.gamesUpdated,
            errors: result.errors,
          },
        });
      } finally {
        // Ensure browser is closed even if syncIncremental throws
        if (browser) {
          await browser.close().catch((err) => {
            console.error('[Manual Sync] Error closing browser:', err);
          });
          browser = undefined;
        }
      }
    } catch (syncError) {
      // Release lock on error
      if (userId) {
        await lockManager.releaseLock(userId).catch((err) => {
          console.error('[Manual Sync] Error releasing lock:', err);
        });
      }
      throw syncError;
    }
  } catch (error) {
    console.error('[Manual Sync] Error:', error);

    // Release lock if still held (safety cleanup) - use userId from outer scope
    if (userId) {
      try {
        await lockManager.releaseLock(userId);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Close browser if still open
    if (browser) {
      await browser.close().catch((err) => {
        console.error('[Manual Sync] Error closing browser in cleanup:', err);
      });
    }

    // Handle authentication errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication') ||
        error.message.includes('Unauthorized'))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please sign in to trigger manual sync',
        },
        { status: 401 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to trigger manual sync',
      },
      { status: 500 }
    );
  }
}
