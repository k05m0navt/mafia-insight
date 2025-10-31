import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  sendSyncFailureAlert,
  sendSyncSuccessAlert,
} from '@/lib/email/adminAlerts';

// Mark this route as dynamic to avoid build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/daily-sync
 * Vercel Cron Job Handler - Runs daily at 2 AM UTC
 * Triggers incremental data synchronization from gomafia.pro
 */
export async function GET(request: NextRequest) {
  try {
    // Verify Vercel Cron authentication
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      console.error('Unauthorized cron request attempt');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('[Cron] Daily sync started at', new Date().toISOString());

    // Create sync log entry
    const syncLog = await prisma.syncLog.create({
      data: {
        type: 'INCREMENTAL',
        status: 'RUNNING',
        startTime: new Date(),
      },
    });

    // Update sync status to running
    await prisma.syncStatus.upsert({
      where: { id: 'current' },
      create: {
        id: 'current',
        isRunning: true,
        currentOperation: 'Starting incremental sync',
        lastSyncType: 'INCREMENTAL',
      },
      update: {
        isRunning: true,
        currentOperation: 'Starting incremental sync',
        lastSyncType: 'INCREMENTAL',
      },
    });

    try {
      // Import sync service (dynamic import to avoid circular dependencies)
      const { runIncrementalSync } = await import('@/lib/gomafia/syncService');

      // Run incremental sync
      const syncResult = await runIncrementalSync();

      // Update sync log with results
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: syncResult.success ? 'COMPLETED' : 'FAILED',
          endTime: new Date(),
          recordsProcessed: syncResult.recordsProcessed || 0,
          errors: syncResult.errors
            ? JSON.stringify(syncResult.errors)
            : undefined,
        },
      });

      // Update sync status
      await prisma.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: false,
          lastSyncTime: new Date(),
          lastError: syncResult.success
            ? null
            : syncResult.error || 'Sync failed',
          totalRecordsProcessed: {
            increment: syncResult.recordsProcessed || 0,
          },
        },
      });

      if (syncResult.success) {
        console.log('[Cron] Daily sync completed successfully');

        // Send success notification (optional, can be disabled)
        const finalSyncLog = await prisma.syncLog.findUnique({
          where: { id: syncLog.id },
        });

        if (finalSyncLog) {
          await sendSyncSuccessAlert({
            id: finalSyncLog.id,
            startTime: finalSyncLog.startTime,
            endTime: finalSyncLog.endTime,
            recordsProcessed: finalSyncLog.recordsProcessed,
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Sync completed successfully',
          recordsProcessed: syncResult.recordsProcessed,
        });
      } else {
        console.error('[Cron] Daily sync failed:', syncResult.error);

        // Send failure notification to admins
        const finalSyncLog = await prisma.syncLog.findUnique({
          where: { id: syncLog.id },
        });

        if (finalSyncLog) {
          await sendSyncFailureAlert({
            id: finalSyncLog.id,
            startTime: finalSyncLog.startTime,
            errors: finalSyncLog.errors,
            recordsProcessed: finalSyncLog.recordsProcessed,
          });
        }

        return NextResponse.json(
          {
            success: false,
            error: syncResult.error || 'Sync failed',
          },
          { status: 500 }
        );
      }
    } catch (syncError) {
      console.error('[Cron] Sync execution error:', syncError);

      // Update sync log with error
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          endTime: new Date(),
          errors: JSON.stringify({
            message:
              syncError instanceof Error ? syncError.message : 'Unknown error',
            stack: syncError instanceof Error ? syncError.stack : undefined,
          }),
        },
      });

      // Update sync status
      await prisma.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: false,
          lastError:
            syncError instanceof Error ? syncError.message : 'Sync failed',
        },
      });

      // Send failure notification
      const finalSyncLog = await prisma.syncLog.findUnique({
        where: { id: syncLog.id },
      });

      if (finalSyncLog) {
        await sendSyncFailureAlert({
          id: finalSyncLog.id,
          startTime: finalSyncLog.startTime,
          errors: finalSyncLog.errors,
          recordsProcessed: finalSyncLog.recordsProcessed,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: syncError instanceof Error ? syncError.message : 'Sync failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Cron] Critical error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Critical error during sync',
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/cron/daily-sync
 * Health check for cron endpoint
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
}
