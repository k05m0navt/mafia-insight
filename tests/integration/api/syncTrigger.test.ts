import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gomafia-sync/sync/trigger/route';

// Mock sync job
vi.mock('@/lib/jobs/syncJob', () => ({
  runSync: vi.fn(),
  runSyncWithRetry: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    syncStatus: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    syncLog: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock notifications
vi.mock('@/lib/notifications/syncNotifications', () => ({
  notifySyncStart: vi.fn(),
  notifySyncCompletion: vi.fn(),
}));

describe('Sync Trigger API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger full sync successfully', async () => {
    const { runSync } = await import('@/lib/jobs/syncJob');
    const { db } = await import('@/lib/db');
    const { notifySyncStart, notifySyncCompletion } = await import(
      '@/lib/notifications/syncNotifications'
    );

    // Mock sync job result
    vi.mocked(runSync).mockResolvedValue({
      success: true,
      recordsProcessed: 100,
      validCount: 95,
      invalidCount: 5,
      partialDataCount: 0,
      emptyDataCount: 0,
      retryCount: 0,
      errors: [],
      duration: 300000,
    });

    // Mock database responses
    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: false,
    });

    vi.mocked(db.syncStatus.upsert).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 0,
      currentOperation: 'Starting FULL sync',
      lastError: null,
      updatedAt: new Date(),
    });

    vi.mocked(db.syncLog.create).mockResolvedValue({
      id: 'sync-log-123',
      type: 'FULL',
      status: 'RUNNING',
      startTime: new Date(),
      endTime: null,
      recordsProcessed: null,
      errors: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/trigger',
      {
        method: 'POST',
        body: JSON.stringify({ type: 'FULL' }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.type).toBe('FULL');
    expect(data.recordsProcessed).toBe(100);
    expect(runSync).toHaveBeenCalledWith({ type: 'FULL' });
    expect(notifySyncStart).toHaveBeenCalledWith('FULL', expect.any(Object));
    expect(notifySyncCompletion).toHaveBeenCalledWith(
      'sync-log-123',
      true,
      100,
      [],
      expect.any(Object)
    );
  });

  it('should trigger incremental sync successfully', async () => {
    const { runSync } = await import('@/lib/jobs/syncJob');
    const { db } = await import('@/lib/db');

    vi.mocked(runSync).mockResolvedValue({
      success: true,
      recordsProcessed: 50,
      validCount: 48,
      invalidCount: 2,
      partialDataCount: 0,
      emptyDataCount: 0,
      retryCount: 0,
      errors: [],
      duration: 150000,
    });

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: false,
    });

    vi.mocked(db.syncStatus.upsert).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 0,
      currentOperation: 'Starting INCREMENTAL sync',
      lastError: null,
      updatedAt: new Date(),
    });

    vi.mocked(db.syncLog.create).mockResolvedValue({
      id: 'sync-log-456',
      type: 'INCREMENTAL',
      status: 'RUNNING',
      startTime: new Date(),
      endTime: null,
      recordsProcessed: null,
      errors: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/trigger',
      {
        method: 'POST',
        body: JSON.stringify({ type: 'INCREMENTAL' }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.type).toBe('INCREMENTAL');
    expect(data.recordsProcessed).toBe(50);
    expect(runSync).toHaveBeenCalledWith({ type: 'INCREMENTAL' });
  });

  it('should handle sync already running', async () => {
    const { db } = await import('@/lib/db');

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 50,
      currentOperation: 'Processing players 1-100',
      lastError: null,
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/trigger',
      {
        method: 'POST',
        body: JSON.stringify({ type: 'FULL' }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Sync is already running');
  });

  it('should handle sync failure', async () => {
    const { runSync } = await import('@/lib/jobs/syncJob');
    const { db } = await import('@/lib/db');
    const { notifySyncStart, notifySyncCompletion } = await import(
      '@/lib/notifications/syncNotifications'
    );

    vi.mocked(runSync).mockResolvedValue({
      success: false,
      recordsProcessed: 10,
      validCount: 5,
      invalidCount: 5,
      partialDataCount: 0,
      emptyDataCount: 0,
      retryCount: 3,
      errors: ['Network timeout', 'Invalid data format'],
      duration: 60000,
    });

    vi.mocked(db.syncStatus.findUnique).mockResolvedValue({
      id: 'current',
      isRunning: false,
    });

    vi.mocked(db.syncStatus.upsert).mockResolvedValue({
      id: 'current',
      isRunning: true,
      progress: 0,
      currentOperation: 'Starting FULL sync',
      lastError: null,
      updatedAt: new Date(),
    });

    vi.mocked(db.syncLog.create).mockResolvedValue({
      id: 'sync-log-789',
      type: 'FULL',
      status: 'FAILED',
      startTime: new Date(),
      endTime: new Date(),
      recordsProcessed: 10,
      errors: ['Network timeout', 'Invalid data format'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/trigger',
      {
        method: 'POST',
        body: JSON.stringify({ type: 'FULL' }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.recordsProcessed).toBe(10);
    expect(data.errors).toContain('Network timeout');
    expect(notifySyncCompletion).toHaveBeenCalledWith(
      'sync-log-789',
      false,
      10,
      ['Network timeout', 'Invalid data format'],
      expect.any(Object)
    );
  });

  it('should handle invalid request body', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/trigger',
      {
        method: 'POST',
        body: JSON.stringify({ type: 'INVALID' }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid sync type');
  });

  it('should handle missing request body', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/trigger',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Request body is required');
  });

  it('should handle database errors', async () => {
    const { db } = await import('@/lib/db');

    vi.mocked(db.syncStatus.findUnique).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/sync/trigger',
      {
        method: 'POST',
        body: JSON.stringify({ type: 'FULL' }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Database connection failed');
  });
});
