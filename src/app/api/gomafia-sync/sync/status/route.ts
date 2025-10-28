import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSyncMetrics,
  getSyncHealthStatus,
} from '@/lib/monitoring/syncMonitor';

export async function GET() {
  try {
    // Get current sync status
    const syncStatus = await db.syncStatus.findUnique({
      where: { id: 'current' },
    });

    // Get sync metrics and health status
    const [metrics, healthStatus] = await Promise.all([
      getSyncMetrics(),
      getSyncHealthStatus(),
    ]);

    return NextResponse.json({
      status: {
        isRunning: syncStatus?.isRunning || false,
        progress: syncStatus?.progress || 0,
        currentOperation: syncStatus?.currentOperation || null,
        lastSyncTime: syncStatus?.lastSyncTime || null,
        lastSyncType: syncStatus?.lastSyncType || null,
        lastError: syncStatus?.lastError || null,
      },
      metrics,
      health: healthStatus,
    });
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
