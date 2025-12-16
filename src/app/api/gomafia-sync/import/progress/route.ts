import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  calculateProcessingRate,
  calculateEstimatedTimeRemaining,
} from '@/lib/gomafia/import/progress-calculator';

export interface ImportProgressResponse {
  currentPhase: string | null;
  progress: number; // 0-100
  currentEntity: {
    id?: string;
    name?: string;
    pageNumber?: number;
  } | null;
  processedCount: number;
  totalCount: number;
  elapsedSeconds: number;
  estimatedSecondsRemaining: number;
  processingRate: number; // entities per second
  isRunning: boolean;
  startTime: string | null;
  lastUpdated: string | null;
}

/**
 * GET /api/gomafia-sync/import/progress
 * Returns current import progress with detailed metrics.
 */
export async function GET(_request: NextRequest) {
  try {
    // Get current sync status
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    if (!syncStatus || !syncStatus.isRunning) {
      return NextResponse.json({
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
      } satisfies ImportProgressResponse);
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
        progressMetrics = errors.progressMetrics as typeof progressMetrics;
      }
    }

    // Use detailed metrics if available, otherwise calculate from syncStatus
    const currentPhase = progressMetrics.currentPhase || null;
    const phaseProgress = progressMetrics.phaseProgress || {
      processed: syncStatus.totalRecordsProcessed || 0,
      total: 0, // Total not available in syncStatus
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
        : calculateEstimatedTimeRemaining(remainingCount, processingRate);

    // Use stored overall progress or from syncStatus
    const progress =
      progressMetrics.overallProgress !== undefined
        ? progressMetrics.overallProgress
        : syncStatus.progress || 0;

    return NextResponse.json({
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
    } satisfies ImportProgressResponse);
  } catch (error) {
    console.error('[API] Error fetching import progress:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch import progress',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
