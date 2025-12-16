import { NextRequest, NextResponse } from 'next/server';
import { resilientDB } from '@/lib/db-resilient';
import { authenticateRequest } from '@/lib/apiAuth';

/**
 * GET /api/gomafia-sync/status
 * Returns sync status for authenticated user.
 * Returns: last sync timestamp, sync enabled status, sync schedule, sync logs
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user: authenticatedUser } = await authenticateRequest(request);
    const userId = authenticatedUser.id;

    // Get user with sync preferences
    const userData = await resilientDB.execute((db) =>
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          syncEnabled: true,
          syncSchedule: true,
          lastSyncAt: true,
        },
      })
    );

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user-specific sync status
    const syncStatus = await resilientDB.execute((db) =>
      db.syncStatus.findUnique({
        where: { id: `user-${userId}` },
      })
    );

    // Get recent sync logs for this user
    const syncLogs = await resilientDB.execute((db) =>
      db.syncLog.findMany({
        where: {
          userId: userId,
          type: 'INCREMENTAL',
        },
        orderBy: {
          startTime: 'desc',
        },
        take: 10, // Get last 10 sync logs
        select: {
          id: true,
          type: true,
          status: true,
          startTime: true,
          endTime: true,
          recordsProcessed: true,
          errors: true,
        },
      })
    );

    return NextResponse.json({
      userId: userData.id,
      syncEnabled: userData.syncEnabled || false,
      syncSchedule: userData.syncSchedule || null,
      lastSyncAt: userData.lastSyncAt?.toISOString() || null,
      syncStatus: syncStatus
        ? {
            isRunning: syncStatus.isRunning || false,
            progress: syncStatus.progress || 0,
            currentOperation: syncStatus.currentOperation || null,
            lastSyncTime: syncStatus.lastSyncTime?.toISOString() || null,
            lastSyncType: syncStatus.lastSyncType || null,
            lastError: syncStatus.lastError || null,
          }
        : null,
      syncLogs: syncLogs.map((log) => ({
        id: log.id,
        type: log.type,
        status: log.status,
        startTime: log.startTime.toISOString(),
        endTime: log.endTime?.toISOString() || null,
        recordsProcessed: log.recordsProcessed || 0,
        errors: log.errors || null,
      })),
    });
  } catch (error) {
    console.error('[Sync Status API] Error:', error);

    // Provide more specific error context
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'Unknown error';

    if (error instanceof Error) {
      errorMessage = error.message;
      // Categorize common errors
      if (
        error.message.includes('not found') ||
        error.message.includes('404')
      ) {
        errorCode = 'USER_NOT_FOUND';
      } else if (
        error.message.includes('authentication') ||
        error.message.includes('unauthorized')
      ) {
        errorCode = 'AUTHENTICATION_ERROR';
      } else if (
        error.message.includes('database') ||
        error.message.includes('connection')
      ) {
        errorCode = 'DATABASE_ERROR';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
      },
      { status: 500 }
    );
  }
}
