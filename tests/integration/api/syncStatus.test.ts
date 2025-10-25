import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gomafia-sync/sync/status/route';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    syncStatus: {
      findUnique: vi.fn(),
    },
    syncLog: {
      findMany: vi.fn(),
    },
  },
}));

// Mock monitoring
vi.mock('@/lib/monitoring/syncMonitor', () => ({
  getSyncMetrics: vi.fn(),
  getSyncHealthStatus: vi.fn(),
}));

describe('Sync Status API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return sync status successfully', async () => {
    const { db } = await import('@/lib/db');
    const { getSyncMetrics, getSyncHealthStatus } = await import(
      '@/lib/monitoring/syncMonitor'
    );

    // Mock database responses
    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      lastSyncTime: new Date('2024-01-01T00:00:00Z'),
      lastSyncType: 'FULL',
      isRunning: false,
      progress: 100,
      currentOperation: null,
      lastError: null,
      updatedAt: new Date(),
    });

    vi.mocked(getSyncMetrics).mockResolvedValue({
      totalSyncs: 10,
      successfulSyncs: 8,
      failedSyncs: 2,
      averageDuration: 300000,
      lastSyncTime: new Date('2024-01-01T00:00:00Z'),
      lastSyncType: 'FULL',
      isRunning: false,
      currentProgress: 100,
      currentOperation: null,
      errorRate: 20,
    });

    vi.mocked(getSyncHealthStatus).mockResolvedValue({
      status: 'HEALTHY',
      message: 'Sync system is operating normally',
      metrics: {
        totalSyncs: 10,
        successfulSyncs: 8,
        failedSyncs: 2,
        averageDuration: 300000,
        lastSyncTime: new Date('2024-01-01T00:00:00Z'),
        lastSyncType: 'FULL',
        isRunning: false,
        currentProgress: 100,
        currentOperation: null,
        errorRate: 20,
      },
      recommendations: [],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/status'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('metrics');
    expect(data).toHaveProperty('health');
    expect(data.status.isRunning).toBe(false);
    expect(data.metrics.totalSyncs).toBe(10);
    expect(data.health.status).toBe('HEALTHY');
  });

  it('should handle database errors gracefully', async () => {
    const { db } = await import('@/lib/db');

    vi.mocked(db.syncStatus.findUnique).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/status'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Database connection failed');
  });

  it('should return running status when sync is in progress', async () => {
    const { db } = await import('@/lib/db');
    const { getSyncMetrics, getSyncHealthStatus } = await import(
      '@/lib/monitoring/syncMonitor'
    );

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      lastSyncTime: new Date('2024-01-01T00:00:00Z'),
      lastSyncType: 'INCREMENTAL',
      isRunning: true,
      progress: 50,
      currentOperation: 'Processing players 1-100',
      lastError: null,
      updatedAt: new Date(),
    });

    vi.mocked(getSyncMetrics).mockResolvedValue({
      totalSyncs: 10,
      successfulSyncs: 8,
      failedSyncs: 2,
      averageDuration: 300000,
      lastSyncTime: new Date('2024-01-01T00:00:00Z'),
      lastSyncType: 'INCREMENTAL',
      isRunning: true,
      currentProgress: 50,
      currentOperation: 'Processing players 1-100',
      errorRate: 20,
    });

    vi.mocked(getSyncHealthStatus).mockResolvedValue({
      status: 'HEALTHY',
      message: 'Sync system is operating normally',
      metrics: {
        totalSyncs: 10,
        successfulSyncs: 8,
        failedSyncs: 2,
        averageDuration: 300000,
        lastSyncTime: new Date('2024-01-01T00:00:00Z'),
        lastSyncType: 'INCREMENTAL',
        isRunning: true,
        currentProgress: 50,
        currentOperation: 'Processing players 1-100',
        errorRate: 20,
      },
      recommendations: [],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/status'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status.isRunning).toBe(true);
    expect(data.status.progress).toBe(50);
    expect(data.status.currentOperation).toBe('Processing players 1-100');
  });

  it('should return error status when sync has failed', async () => {
    const { db } = await import('@/lib/db');
    const { getSyncMetrics, getSyncHealthStatus } = await import(
      '@/lib/monitoring/syncMonitor'
    );

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      lastSyncTime: new Date('2024-01-01T00:00:00Z'),
      lastSyncType: 'FULL',
      isRunning: false,
      progress: 0,
      currentOperation: null,
      lastError: 'Network timeout',
      updatedAt: new Date(),
    });

    vi.mocked(getSyncMetrics).mockResolvedValue({
      totalSyncs: 10,
      successfulSyncs: 5,
      failedSyncs: 5,
      averageDuration: 300000,
      lastSyncTime: new Date('2024-01-01T00:00:00Z'),
      lastSyncType: 'FULL',
      isRunning: false,
      currentProgress: 0,
      currentOperation: null,
      errorRate: 50,
    });

    vi.mocked(getSyncHealthStatus).mockResolvedValue({
      status: 'CRITICAL',
      message: 'High error rate detected',
      metrics: {
        totalSyncs: 10,
        successfulSyncs: 5,
        failedSyncs: 5,
        averageDuration: 300000,
        lastSyncTime: new Date('2024-01-01T00:00:00Z'),
        lastSyncType: 'FULL',
        isRunning: false,
        currentProgress: 0,
        currentOperation: null,
        errorRate: 50,
      },
      recommendations: [
        'Investigate recent sync failures',
        'Check network connectivity',
      ],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/status'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status.isRunning).toBe(false);
    expect(data.status.lastError).toBe('Network timeout');
    expect(data.health.status).toBe('CRITICAL');
    expect(data.health.recommendations).toContain(
      'Investigate recent sync failures'
    );
  });
});
