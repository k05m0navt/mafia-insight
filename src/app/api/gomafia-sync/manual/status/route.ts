import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { authenticateRequest } from '@/lib/apiAuth';

/**
 * GET /api/gomafia-sync/manual/status
 * Get user-specific sync status for manual sync progress tracking.
 * Returns current sync status, progress, and operation details.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user } = await authenticateRequest(request);
    const userId = user.id;

    // Get user-specific sync status (syncIncremental uses id: `user-${userId}`)
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: `user-${userId}` },
    });

    // Get latest sync log for this user
    const latestSyncLog = await db.syncLog.findFirst({
      where: {
        userId: userId,
        type: 'INCREMENTAL',
      },
      orderBy: { startTime: 'desc' },
    });

    const response = NextResponse.json({
      isRunning: syncStatus?.isRunning || false,
      progress: syncStatus?.progress || 0,
      currentOperation: syncStatus?.currentOperation || null,
      lastSyncTime: syncStatus?.lastSyncTime?.toISOString() || null,
      lastSyncType: syncStatus?.lastSyncType || null,
      lastError: syncStatus?.lastError || null,
      syncLogId: latestSyncLog?.id || null,
      syncLogStatus: latestSyncLog?.status || null,
      startTime: latestSyncLog?.startTime?.toISOString() || null,
      endTime: latestSyncLog?.endTime?.toISOString() || null,
    });

    // Prevent caching to ensure fresh data
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('[Manual Sync Status] Error:', error);

    // Handle authentication errors
    if (
      error instanceof Error &&
      (error.message.includes('Authentication') ||
        error.message.includes('Unauthorized'))
    ) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please sign in to view sync status',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch sync status',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
