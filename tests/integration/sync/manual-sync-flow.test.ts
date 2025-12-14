import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gomafia-sync/manual/route';
import { GET } from '@/app/api/gomafia-sync/manual/status/route';
import { createTestUser } from '../../setup';

/**
 * Integration test for complete manual sync flow:
 * 1. Trigger manual sync
 * 2. Verify incremental import is called
 * 3. Verify status update
 * 4. Verify logging
 */

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    syncStatus: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    syncLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db-resilient', () => ({
  resilientDB: {
    execute: vi.fn((fn) => fn({})),
  },
}));

vi.mock('@/lib/apiAuth', () => ({
  authenticateRequest: vi.fn(),
}));

vi.mock('@/lib/gomafia/import/import-orchestrator', () => ({
  ImportOrchestrator: vi.fn(),
}));

vi.mock('@/lib/gomafia/import/advisory-lock', () => ({
  AdvisoryLockManager: vi.fn(),
}));

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

describe('Manual Sync Flow Integration', () => {
  let mockUser: Awaited<ReturnType<typeof createTestUser>>;
  let mockAuthUser: any;
  let mockLockManager: any;
  let mockBrowser: any;
  let mockOrchestrator: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUser = await createTestUser();
    mockAuthUser = {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      },
    };

    // Setup AdvisoryLock mock
    mockLockManager = {
      acquireLock: vi.fn().mockResolvedValue(true),
      releaseLock: vi.fn().mockResolvedValue(undefined),
    };
    const { AdvisoryLockManager } = await import(
      '@/lib/gomafia/import/advisory-lock'
    );
    vi.mocked(AdvisoryLockManager).mockImplementation(() => mockLockManager);

    // Setup browser mock
    mockBrowser = {
      close: vi.fn().mockResolvedValue(undefined),
    };
    const { chromium } = await import('playwright');
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser);

    // Setup orchestrator mock
    mockOrchestrator = {
      syncIncremental: vi.fn().mockResolvedValue({
        gamesImported: 5,
        gamesUpdated: 3,
        errors: 0,
        success: true,
      }),
    };
    const { ImportOrchestrator } = await import(
      '@/lib/gomafia/import/import-orchestrator'
    );
    vi.mocked(ImportOrchestrator).mockImplementation(() => mockOrchestrator);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full manual sync flow: trigger → import → status update → logging', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { resilientDB } = await import('@/lib/db-resilient');
    const { prisma } = await import('@/lib/db');

    // Mock authentication
    vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser);

    // Mock user lookup
    vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
      const mockDb = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: mockUser.id,
            lastSyncAt: new Date('2024-01-01T00:00:00Z'),
          }),
        },
      };
      return fn(mockDb as any);
    });

    // Step 1: Trigger manual sync
    const triggerRequest = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/manual',
      {
        method: 'POST',
      }
    );

    const triggerResponse = await POST(triggerRequest);
    const triggerData = await triggerResponse.json();

    // Verify trigger succeeded
    expect(triggerResponse.status).toBe(200);
    expect(triggerData.success).toBe(true);
    expect(triggerData.summary.gamesImported).toBe(5);
    expect(triggerData.summary.gamesUpdated).toBe(3);

    // Verify lock was acquired and released
    expect(mockLockManager.acquireLock).toHaveBeenCalledWith(mockUser.id);
    expect(mockLockManager.releaseLock).toHaveBeenCalledWith(mockUser.id);

    // Verify orchestrator was called with correct parameters
    expect(mockOrchestrator.syncIncremental).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Date)
    );

    // Step 2: Check sync status
    // Mock sync status response
    const mockSyncStatus = {
      id: `user-${mockUser.id}`,
      isRunning: false,
      progress: 100,
      currentOperation: null,
      lastSyncTime: new Date('2024-01-01T12:00:00Z'),
      lastSyncType: 'INCREMENTAL',
      lastError: null,
      updatedAt: new Date(),
    };

    const mockSyncLog = {
      id: 'sync-log-123',
      userId: mockUser.id,
      type: 'INCREMENTAL',
      status: 'COMPLETED',
      startTime: new Date('2024-01-01T12:00:00Z'),
      endTime: new Date('2024-01-01T12:05:00Z'),
      recordsProcessed: 8,
      errors: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.syncStatus.findUnique).mockResolvedValue(
      mockSyncStatus as any
    );
    vi.mocked(prisma.syncLog.findFirst).mockResolvedValue(mockSyncLog as any);

    const statusRequest = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/manual/status'
    );

    const statusResponse = await GET(statusRequest);
    const statusData = await statusResponse.json();

    // Verify status is returned correctly
    expect(statusResponse.status).toBe(200);
    expect(statusData.isRunning).toBe(false);
    expect(statusData.lastSyncType).toBe('INCREMENTAL');
    expect(statusData.syncLogStatus).toBe('COMPLETED');
  });

  it('should prevent concurrent syncs for same user', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');

    vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser);

    // First request: lock acquired
    mockLockManager.acquireLock.mockResolvedValueOnce(true);

    // Second request: lock cannot be acquired (sync already running)
    mockLockManager.acquireLock.mockResolvedValueOnce(false);

    const request1 = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/manual',
      {
        method: 'POST',
      }
    );

    const request2 = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/manual',
      {
        method: 'POST',
      }
    );

    // Trigger first sync (should succeed)
    const response1 = await POST(request1);
    expect(response1.status).toBe(200);

    // Trigger second sync immediately (should fail with 409)
    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(response2.status).toBe(409);
    expect(data2.message).toContain('already in progress');
  });

  it('should handle sync errors and release lock', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { resilientDB } = await import('@/lib/db-resilient');

    vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser);

    vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
      const mockDb = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: mockUser.id,
            lastSyncAt: new Date('2024-01-01T00:00:00Z'),
          }),
        },
      };
      return fn(mockDb as any);
    });

    // Mock orchestrator to throw error
    mockOrchestrator.syncIncremental.mockRejectedValueOnce(
      new Error('Sync failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/manual',
      {
        method: 'POST',
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify error response
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);

    // Verify lock is released even on error
    expect(mockLockManager.releaseLock).toHaveBeenCalledWith(mockUser.id);

    // Verify browser is closed
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});
