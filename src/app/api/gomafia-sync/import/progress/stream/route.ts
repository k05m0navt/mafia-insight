import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  calculateProcessingRate,
  calculateEstimatedTimeRemaining,
} from '@/lib/gomafia/import/progress-calculator';
import type { ImportProgressResponse } from '../progress/route';

/**
 * GET /api/gomafia-sync/import/progress/stream
 * Streams real-time import progress updates via Server-Sent Events (SSE).
 * Sends updates every 1 second when import is running.
 */
export async function GET(_request: NextRequest) {
  try {
    // Create Server-Sent Events stream
    // Store intervalId in outer scope so it's accessible to cancel() handler
    let intervalId: NodeJS.Timeout | null = null;
    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        const sendProgress = async () => {
          try {
            if (isClosed) {
              return;
            }

            // Get current sync status
            const syncStatus = await db.syncStatus.findUnique({
              where: { id: 'current' },
            });

            if (!syncStatus || !syncStatus.isRunning) {
              // Import not running, send final update and close
              const finalData: ImportProgressResponse = {
                currentPhase: null,
                progress: 0,
                currentEntity: null,
                processedCount: 0,
                totalCount: 0,
                elapsedSeconds: 0,
                estimatedSecondsRemaining: 0,
                processingRate: 0,
                isRunning: false,
                startTime: null,
                lastUpdated: null,
              };
              const data = `data: ${JSON.stringify(finalData)}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
              if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
              }
              controller.close();
              isClosed = true;
              return;
            }

            // Get current sync log to retrieve detailed progress metrics
            const syncLog = await db.syncLog.findFirst({
              where: {
                status: 'RUNNING',
              },
              orderBy: {
                startTime: 'desc',
              },
            });

            let progressMetrics: {
              currentPhase?: string;
              phaseProgress?: { processed: number; total: number };
              currentEntity?: {
                id?: string;
                name?: string;
                pageNumber?: number;
              } | null;
              processingRate?: number;
              elapsedSeconds?: number;
              estimatedSecondsRemaining?: number;
              overallProgress?: number;
              startTime?: string;
              lastUpdated?: string;
            } = {};

            if (syncLog?.errors && typeof syncLog.errors === 'object') {
              const errors = syncLog.errors as Record<string, unknown>;
              if (
                errors.progressMetrics &&
                typeof errors.progressMetrics === 'object'
              ) {
                progressMetrics =
                  errors.progressMetrics as typeof progressMetrics;
              }
            }

            // Use detailed metrics if available, otherwise calculate from syncStatus
            const currentPhase = progressMetrics.currentPhase || null;
            const phaseProgress = progressMetrics.phaseProgress || {
              processed: syncStatus.totalRecordsProcessed || 0,
              total: 0,
            };
            const currentEntity = progressMetrics.currentEntity || null;
            const startTime = progressMetrics.startTime
              ? new Date(progressMetrics.startTime)
              : syncLog?.startTime || null;

            // Calculate elapsed time
            const elapsedSeconds = progressMetrics.elapsedSeconds
              ? progressMetrics.elapsedSeconds
              : startTime
                ? (new Date().getTime() - startTime.getTime()) / 1000
                : 0;

            // Use stored processing rate or calculate it
            const processingRate =
              progressMetrics.processingRate ||
              calculateProcessingRate(phaseProgress.processed, elapsedSeconds);

            // Use stored estimated time remaining or calculate it
            const remainingCount = Math.max(
              0,
              phaseProgress.total - phaseProgress.processed
            );
            const estimatedSecondsRemaining =
              progressMetrics.estimatedSecondsRemaining !== undefined
                ? progressMetrics.estimatedSecondsRemaining
                : calculateEstimatedTimeRemaining(
                    remainingCount,
                    processingRate
                  );

            // Use stored overall progress or from syncStatus
            const progress =
              progressMetrics.overallProgress !== undefined
                ? progressMetrics.overallProgress
                : syncStatus.progress || 0;

            const progressData: ImportProgressResponse = {
              currentPhase,
              progress,
              currentEntity,
              processedCount: phaseProgress.processed,
              totalCount: phaseProgress.total,
              elapsedSeconds,
              estimatedSecondsRemaining,
              processingRate,
              isRunning: syncStatus.isRunning,
              startTime: startTime?.toISOString() || null,
              lastUpdated: syncStatus.updatedAt.toISOString(),
            };

            // Send progress update
            const data = `data: ${JSON.stringify(progressData)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));

            // Continue streaming if import is still running
            if (syncStatus.isRunning) {
              // Schedule next update (1 second interval)
              if (!intervalId) {
                intervalId = setInterval(sendProgress, 1000);
              }
            } else {
              // Import completed, send final update and close
              if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
              }
              controller.close();
              isClosed = true;
            }
          } catch (error) {
            console.error('[SSE] Error sending progress update:', error);
            // Send error and close stream
            const errorData = `data: ${JSON.stringify({
              error: 'Failed to fetch progress',
              message: error instanceof Error ? error.message : 'Unknown error',
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(errorData));
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
            controller.close();
            isClosed = true;
          }
        };

        // Send initial progress immediately
        sendProgress();
      },

      cancel() {
        // Cleanup when client disconnects
        // Clear interval to prevent memory leaks
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        isClosed = true;
        console.log('[SSE] Client disconnected from progress stream');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering in nginx
      },
    });
  } catch (error) {
    console.error('[SSE] Error creating progress stream:', error);

    // Return error as SSE
    const errorStream = new ReadableStream({
      start(controller) {
        const errorData = `data: ${JSON.stringify({
          error: 'Failed to create progress stream',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(errorData));
        controller.close();
      },
    });

    return new Response(errorStream, {
      status: 500,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }
}
