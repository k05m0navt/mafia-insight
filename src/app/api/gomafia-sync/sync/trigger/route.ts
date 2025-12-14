import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runSync } from '@/lib/jobs/syncJob';
import {
  notifySyncStart,
  notifySyncCompletion,
} from '@/lib/notifications/syncNotifications';
import { runDataVerification } from '@/services/sync/verificationService';
import { sendAdminAlerts } from '@/services/sync/notificationService';
import { getValidationThreshold } from '@/services/validation-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type || !['FULL', 'INCREMENTAL'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid sync type. Must be FULL or INCREMENTAL',
        },
        { status: 400 }
      );
    }

    // Check if sync is already running
    const currentStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    if (currentStatus?.isRunning) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sync is already running',
          currentOperation: currentStatus.currentOperation,
          progress: currentStatus.progress,
        },
        { status: 409 }
      );
    }

    // Create sync log entry
    const syncLog = await db.syncLog.create({
      data: {
        type,
        status: 'RUNNING',
        startTime: new Date(),
      },
    });

    // Update sync status
    await db.syncStatus.upsert({
      where: { id: 'current' },
      update: {
        isRunning: true,
        progress: 0,
        currentOperation: `Starting ${type} sync`,
        lastError: null,
      },
      create: {
        id: 'current',
        isRunning: true,
        progress: 0,
        currentOperation: `Starting ${type} sync`,
      },
    });

    // Send notification
    await notifySyncStart(type);

    // Run sync in background
    runSync({ type })
      .then(async (result) => {
        // Update sync log with completion
        await db.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: result.success ? 'COMPLETED' : 'FAILED',
            endTime: new Date(),
            recordsProcessed: result.recordsProcessed,
            errors: result.errors.length > 0 ? result.errors : undefined,
          },
        });

        // Update sync status
        await db.syncStatus.upsert({
          where: { id: 'current' },
          update: {
            lastSyncTime: new Date(),
            lastSyncType: type,
            isRunning: false,
            progress: 100,
            currentOperation: null,
            lastError: result.success
              ? null
              : result.errors[0] || 'Unknown error',
          },
          create: {
            id: 'current',
            lastSyncTime: new Date(),
            lastSyncType: type,
            isRunning: false,
            progress: 100,
          },
        });

        // Fetch validation metrics from sync log for notification (Task 9: AC #1, #3)
        const completedSyncLog = await db.syncLog.findUnique({
          where: { id: syncLog.id },
          select: { errors: true },
        });

        let validationMetrics:
          | {
              validationRate: number;
              meetsThreshold: boolean;
              totalRecords: number;
              validRecords: number;
              invalidRecords: number;
            }
          | undefined = undefined;

        if (
          completedSyncLog?.errors &&
          typeof completedSyncLog.errors === 'object'
        ) {
          const errors = completedSyncLog.errors as Record<string, unknown>;
          const metrics = errors.validationMetrics as
            | {
                overall?: {
                  validationRate: number;
                  meetsThreshold: boolean;
                  totalRecords: number;
                  validRecords: number;
                  invalidRecords: number;
                };
              }
            | undefined;

          if (metrics?.overall) {
            validationMetrics = {
              validationRate: metrics.overall.validationRate,
              meetsThreshold: metrics.overall.meetsThreshold,
              totalRecords: metrics.overall.totalRecords,
              validRecords: metrics.overall.validRecords,
              invalidRecords: metrics.overall.invalidRecords,
            };
          }
        }

        // Also check syncStatus for validation metrics
        if (!validationMetrics) {
          const syncStatus = await db.syncStatus.findUnique({
            where: { id: 'current' },
            select: {
              validationRate: true,
              totalRecordsProcessed: true,
              validRecords: true,
              invalidRecords: true,
            },
          });

          if (
            syncStatus?.validationRate !== null &&
            syncStatus?.totalRecordsProcessed !== null
          ) {
            const threshold = getValidationThreshold();
            validationMetrics = {
              validationRate: syncStatus.validationRate,
              meetsThreshold: syncStatus.validationRate >= threshold,
              totalRecords: syncStatus.totalRecordsProcessed,
              validRecords: syncStatus.validRecords ?? 0,
              invalidRecords: syncStatus.invalidRecords ?? 0,
            };
          }
        }

        // Send completion notification with validation metrics (Task 9: AC #1, #3)
        await notifySyncCompletion(
          syncLog.id,
          result.success,
          result.recordsProcessed,
          result.errors,
          validationMetrics
        );

        // Run automatic data verification after successful syncs
        if (result.success && type === 'FULL') {
          console.log('[Sync] Running automatic data verification...');
          try {
            const verificationReport = await runDataVerification('SCHEDULED');

            // Alert if accuracy is below threshold
            if (verificationReport.overallAccuracy < 95) {
              await sendAdminAlerts({
                type: 'SYSTEM_ALERT',
                title: 'Data Integrity Warning',
                message: `Post-sync verification showed ${verificationReport.overallAccuracy.toFixed(2)}% accuracy (below 95% threshold)`,
                details: {
                  syncLogId: syncLog.id,
                  overallAccuracy: verificationReport.overallAccuracy,
                  status: verificationReport.status,
                },
              });
            }
          } catch (verificationError) {
            console.error('[Sync] Verification failed:', verificationError);
            // Don't fail the sync if verification fails
          }
        }
      })
      .catch(async (error) => {
        console.error('Sync failed:', error);

        // Update sync log with failure
        await db.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'FAILED',
            endTime: new Date(),
            errors: [error.message || 'Unknown error'],
          },
        });

        // Update sync status
        await db.syncStatus.upsert({
          where: { id: 'current' },
          update: {
            isRunning: false,
            progress: 0,
            currentOperation: null,
            lastError: error.message || 'Unknown error',
          },
          create: {
            id: 'current',
            isRunning: false,
            lastError: error.message || 'Unknown error',
          },
        });

        // Send failure notification
        await notifySyncCompletion(syncLog.id, false, 0, [
          error.message || 'Unknown error',
        ]);
      });

    return NextResponse.json({
      success: true,
      type,
      message: 'Sync triggered successfully',
      syncLogId: syncLog.id,
    });
  } catch (error) {
    console.error('Failed to trigger sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
