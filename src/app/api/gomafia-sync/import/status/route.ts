import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { authenticateRequest } from '@/lib/apiAuth';

/**
 * GET /api/gomafia-sync/import/status
 * Get import status for a specific import job
 * Query parameters: jobId (required)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user } = await authenticateRequest(request);

    // Get jobId from query parameters
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        {
          error: 'jobId query parameter is required',
          code: 'MISSING_JOB_ID',
        },
        { status: 400 }
      );
    }

    // Get sync log
    const syncLog = await db.syncLog.findUnique({
      where: { id: jobId },
    });

    if (!syncLog) {
      return NextResponse.json(
        {
          error: 'Import job not found',
          code: 'JOB_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Get user-specific sync status
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: `user-${user.id}` },
    });

    if (!syncStatus) {
      return NextResponse.json(
        {
          error: 'Import status not found',
          code: 'STATUS_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Calculate percentage complete
    const totalGames = syncStatus.totalRecordsProcessed || 0;
    const processedGames = syncStatus.validRecords || 0;
    const percentageComplete =
      totalGames > 0 ? Math.round((processedGames / totalGames) * 100) : 0;

    // Calculate estimated time remaining
    // Simple estimation: assume average processing rate
    let estimatedTimeRemaining = null;
    if (syncStatus.isRunning && processedGames > 0 && totalGames > 0) {
      // Estimate based on current progress rate
      // This is a simplified calculation - could be enhanced with actual timing data
      const remainingGames = totalGames - processedGames;
      const estimatedSecondsPerGame = 2; // Conservative estimate
      estimatedTimeRemaining = remainingGames * estimatedSecondsPerGame;
    }

    // Determine current phase from checkpoint or status
    const checkpoint = await db.importCheckpoint.findUnique({
      where: { id: `user-${user.id}` },
    });

    const currentPhase = checkpoint?.currentPhase || 'UNKNOWN';

    // Determine status
    let status: 'running' | 'completed' | 'failed' | 'paused' = 'running';
    if (syncLog.status === 'COMPLETED') {
      status = 'completed';
    } else if (syncLog.status === 'FAILED' || syncLog.status === 'CANCELLED') {
      status = 'failed';
    } else if (checkpoint?.isPaused) {
      status = 'paused';
    } else if (syncStatus.isRunning) {
      status = 'running';
    }

    const response = NextResponse.json({
      jobId,
      percentageComplete,
      currentGameNumber: processedGames,
      totalGames,
      estimatedTimeRemaining,
      currentPhase,
      status,
      currentOperation: syncStatus.currentOperation || null,
      lastError: syncStatus.lastError || null,
      startTime: syncLog.startTime.toISOString(),
      endTime: syncLog.endTime?.toISOString() || null,
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

    // Handle authentication errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication') ||
        error.message.includes('required'))
    ) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

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
