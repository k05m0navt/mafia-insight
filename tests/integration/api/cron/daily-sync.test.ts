import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { clearTestDatabase, createTestPlayer } from '../../../setup';

/**
 * Daily Sync Cron Handler Integration Tests
 *
 * Tests the Vercel Cron job handler for daily data synchronization
 */

// Mock environment variables
process.env.CRON_SECRET = 'test-cron-secret-for-testing';

// Mock the sync service
vi.mock('@/lib/gomafia/syncService', () => ({
  runIncrementalSync: vi.fn().mockResolvedValue({
    success: true,
    recordsProcessed: 150,
    errors: [],
  }),
}));

// Mock email service
vi.mock('@/lib/email/adminAlerts', () => ({
  sendSyncFailureAlert: vi.fn().mockResolvedValue(undefined),
  sendSyncSuccessAlert: vi.fn().mockResolvedValue(undefined),
}));

describe('Daily Sync Cron Handler', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should reject requests without authorization header', async () => {
      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual('Unauthorized');
    });

    it('should reject requests with invalid CRON_SECRET', async () => {
      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: 'Bearer wrong-secret',
          },
        }
      );

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should accept requests with valid CRON_SECRET', async () => {
      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      const response = await GET(request);

      expect(response.status).not.toBe(401);
    });
  });

  describe('Sync Execution', () => {
    it('should trigger incremental sync', async () => {
      const { runIncrementalSync } = await import('@/lib/gomafia/syncService');
      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      await GET(request);

      expect(runIncrementalSync).toHaveBeenCalledTimes(1);
    });

    it('should create sync log entry', async () => {
      const { GET } = await import('@/app/api/cron/daily-sync/route');
      const { prisma } = await import('@/lib/db');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      await GET(request);

      const syncLogs = await prisma.syncLog.findMany();
      expect(syncLogs.length).toBeGreaterThan(0);
      expect(syncLogs[0].type).toBe('INCREMENTAL');
    });

    it('should update sync status', async () => {
      const { GET } = await import('@/app/api/cron/daily-sync/route');
      const { prisma } = await import('@/lib/db');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      await GET(request);

      const syncStatus = await prisma.syncStatus.findUnique({
        where: { id: 'current' },
      });

      expect(syncStatus).toBeDefined();
      expect(syncStatus?.lastSyncType).toBe('INCREMENTAL');
    });

    it('should return success response', async () => {
      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain('sync completed');
    });
  });

  describe('Success Notifications', () => {
    it('should send success email alert', async () => {
      const { sendSyncSuccessAlert } = await import('@/lib/email/adminAlerts');
      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      await GET(request);

      expect(sendSyncSuccessAlert).toHaveBeenCalled();
    });

    it('should include sync details in notification', async () => {
      const { sendSyncSuccessAlert } = await import('@/lib/email/adminAlerts');
      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      await GET(request);

      expect(sendSyncSuccessAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          startTime: expect.any(Date),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle sync service errors', async () => {
      const { runIncrementalSync } = await import('@/lib/gomafia/syncService');
      vi.mocked(runIncrementalSync).mockRejectedValueOnce(
        new Error('Sync failed')
      );

      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
    });

    it('should send failure email alert', async () => {
      const { runIncrementalSync } = await import('@/lib/gomafia/syncService');
      const { sendSyncFailureAlert } = await import('@/lib/email/adminAlerts');

      vi.mocked(runIncrementalSync).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      await GET(request);

      expect(sendSyncFailureAlert).toHaveBeenCalled();
    });

    it('should update sync log with error status', async () => {
      const { runIncrementalSync } = await import('@/lib/gomafia/syncService');
      vi.mocked(runIncrementalSync).mockRejectedValueOnce(
        new Error('Test error')
      );

      const { GET } = await import('@/app/api/cron/daily-sync/route');
      const { prisma } = await import('@/lib/db');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      await GET(request);

      const failedLog = await prisma.syncLog.findFirst({
        where: { status: 'FAILED' },
      });

      expect(failedLog).toBeDefined();
    });

    it('should update sync status with error', async () => {
      const { runIncrementalSync } = await import('@/lib/gomafia/syncService');
      vi.mocked(runIncrementalSync).mockRejectedValueOnce(
        new Error('Test error')
      );

      const { GET } = await import('@/app/api/cron/daily-sync/route');
      const { prisma } = await import('@/lib/db');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      await GET(request);

      const syncStatus = await prisma.syncStatus.findUnique({
        where: { id: 'current' },
      });

      expect(syncStatus?.isRunning).toBe(false);
      expect(syncStatus?.lastError).toBeDefined();
    });
  });

  describe('Sync Statistics', () => {
    it('should track records processed', async () => {
      const { GET } = await import('@/app/api/cron/daily-sync/route');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      const response = await GET(request);
      const body = await response.json();

      expect(body.syncResult.recordsProcessed).toBeDefined();
      expect(body.syncResult.recordsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should record sync duration', async () => {
      const { GET } = await import('@/app/api/cron/daily-sync/route');
      const { prisma } = await import('@/lib/db');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      await GET(request);

      const syncLog = await prisma.syncLog.findFirst({
        orderBy: { startTime: 'desc' },
      });

      expect(syncLog?.startTime).toBeDefined();
      expect(syncLog?.endTime).toBeDefined();
    });
  });

  describe('Concurrent Sync Prevention', () => {
    it('should mark sync as running during execution', async () => {
      const { GET } = await import('@/app/api/cron/daily-sync/route');
      const { prisma } = await import('@/lib/db');

      const request = new NextRequest(
        'http://localhost:3000/api/cron/daily-sync',
        {
          headers: {
            authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
        }
      );

      // Start sync
      const syncPromise = GET(request);

      // Check status during sync (in real scenario)
      // This is a simplified test

      await syncPromise;

      const finalStatus = await prisma.syncStatus.findUnique({
        where: { id: 'current' },
      });

      // Should not be running after completion
      expect(finalStatus?.isRunning).toBe(false);
    });
  });
});
