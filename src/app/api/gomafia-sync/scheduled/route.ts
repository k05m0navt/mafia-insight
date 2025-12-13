import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { chromium } from 'playwright';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';
import { sendSyncCompletionNotification } from '@/lib/notifications/sync-notifications';
import { retryWithBackoff } from '@/lib/errorTracking/syncErrors';

/**
 * POST /api/gomafia-sync/scheduled
 * Processes scheduled sync for all users with sync enabled.
 * Returns sync summary (users processed, games imported, errors).
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (from cron job)
    // In production, you should verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Scheduled Sync] Starting scheduled sync job...');

    // Query users with syncEnabled = true
    const usersWithSyncEnabled = await resilientDB.execute((db) =>
      db.user.findMany({
        where: {
          syncEnabled: true,
        },
        include: {
          players: {
            take: 1, // Get first player profile
          },
        },
      })
    );

    console.log(
      `[Scheduled Sync] Found ${usersWithSyncEnabled.length} users with sync enabled`
    );

    const summary = {
      usersProcessed: 0,
      usersSkipped: 0,
      totalGamesImported: 0,
      totalGamesUpdated: 0,
      totalErrors: 0,
      userResults: [] as Array<{
        userId: string;
        success: boolean;
        gamesImported: number;
        gamesUpdated: number;
        errors: number;
        error?: string;
      }>,
    };

    const lockManager = new AdvisoryLockManager(db);

    // Process each user
    for (const user of usersWithSyncEnabled) {
      // Check if user has a player profile
      if (!user.players || user.players.length === 0) {
        console.log(
          `[Scheduled Sync] User ${user.id} has no player profile, skipping`
        );
        summary.usersSkipped++;
        continue;
      }

      // Try to acquire lock for this user (check for active imports)
      const lockAcquired = await lockManager.acquireLock(user.id);
      if (!lockAcquired) {
        console.log(
          `[Scheduled Sync] User ${user.id} has active import, skipping scheduled sync`
        );
        summary.usersSkipped++;
        continue;
      }

      // Get lastSyncAt timestamp
      const lastSyncAt = user.lastSyncAt || new Date(0); // Use epoch if never synced

      let browser;
      const syncStartTime = new Date();
      try {
        // Run incremental sync with retry logic for transient failures
        const result = await retryWithBackoff(
          async () => {
            // Launch browser for scraping (create new browser for each retry attempt)
            if (browser) {
              await browser.close();
            }
            browser = await chromium.launch({ headless: true });
            const orchestrator = new ImportOrchestrator(db, browser);

            // Run incremental sync
            return await orchestrator.syncIncremental(user.id, lastSyncAt);
          },
          3, // maxRetries: 3 attempts total
          2000 // initialDelay: 2 seconds
        );

        summary.usersProcessed++;
        summary.totalGamesImported += result.gamesImported;
        summary.totalGamesUpdated += result.gamesUpdated;
        summary.totalErrors += result.errors;

        summary.userResults.push({
          userId: user.id,
          success: result.success,
          gamesImported: result.gamesImported,
          gamesUpdated: result.gamesUpdated,
          errors: result.errors,
        });

        console.log(
          `[Scheduled Sync] User ${user.id}: ${result.gamesImported} imported, ${result.gamesUpdated} updated, ${result.errors} errors`
        );

        // Send notification if sync completed (success or failure)
        if (
          result.gamesImported > 0 ||
          result.gamesUpdated > 0 ||
          result.errors > 0
        ) {
          await sendSyncCompletionNotification({
            userId: user.id,
            success: result.success,
            gamesImported: result.gamesImported,
            gamesUpdated: result.gamesUpdated,
            errors: result.errors,
            syncType: 'INCREMENTAL',
            startTime: syncStartTime,
            endTime: new Date(),
          });
        }
      } catch (error) {
        console.error(
          `[Scheduled Sync] Error processing user ${user.id} after retries:`,
          error
        );

        // Check if error is transient (retryable) - if so, will retry on next schedule
        const isTransientError =
          error instanceof Error &&
          (error.message.includes('timeout') ||
            error.message.includes('connection') ||
            error.message.includes('network') ||
            error.message.includes('ECONNRESET') ||
            error.message.includes('ETIMEDOUT'));

        summary.totalErrors++;
        summary.userResults.push({
          userId: user.id,
          success: false,
          gamesImported: 0,
          gamesUpdated: 0,
          errors: 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          willRetryOnNextSchedule: isTransientError,
        });

        // Log that this will be retried on next schedule if transient
        if (isTransientError) {
          console.log(
            `[Scheduled Sync] Transient error for user ${user.id}, will retry on next schedule`
          );
        }
      } finally {
        // Always release lock and close browser
        await lockManager.releaseLock(user.id);
        if (browser) {
          await browser.close();
        }
      }
    }

    console.log(
      `[Scheduled Sync] Completed: ${summary.usersProcessed} users processed, ${summary.totalGamesImported} games imported, ${summary.totalGamesUpdated} games updated, ${summary.totalErrors} errors`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Scheduled sync completed',
        summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Scheduled Sync] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
