import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gomafia-sync/scheduled/route';
import { createTestUser, createTestPlayer } from '../../setup';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db-resilient', () => ({
  resilientDB: {
    execute: vi.fn((fn) => fn({})),
  },
}));

vi.mock('@/lib/gomafia/import/import-orchestrator', () => ({
  ImportOrchestrator: vi.fn().mockImplementation(() => ({
    syncIncremental: vi.fn(),
  })),
}));

vi.mock('@/lib/gomafia/import/advisory-lock', () => ({
  AdvisoryLockManager: vi.fn().mockImplementation(() => ({
    acquireLock: vi.fn(),
    releaseLock: vi.fn(),
  })),
}));

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(async () => ({
      close: vi.fn(),
    })),
  },
}));

vi.mock('@/lib/notifications/sync-notifications', () => ({
  sendSyncCompletionNotification: vi.fn(),
}));

describe('Scheduled Sync API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process users with sync enabled', async () => {
    const { resilientDB } = await import('@/lib/db-resilient');
    const { ImportOrchestrator } = await import(
      '@/lib/gomafia/import/import-orchestrator'
    );
    const { AdvisoryLockManager } = await import(
      '@/lib/gomafia/import/advisory-lock'
    );

    const mockUser = await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    // Mock database responses
    vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
      const mockDb = {
        user: {
          findMany: vi.fn().mockResolvedValue([
            {
              ...mockUser,
              syncEnabled: true,
              lastSyncAt: new Date('2024-01-01T00:00:00Z'),
              players: [{ gomafiaId: 'player-123' }],
            },
          ]),
        },
      };
      return fn(mockDb as any);
    });

    const mockOrchestrator = {
      syncIncremental: vi.fn().mockResolvedValue({
        gamesImported: 5,
        gamesUpdated: 2,
        errors: 0,
        success: true,
      }),
    };

    vi.mocked(ImportOrchestrator).mockImplementation(
      () => mockOrchestrator as any
    );

    const mockLockManager = {
      acquireLock: vi.fn().mockResolvedValue(true),
      releaseLock: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(AdvisoryLockManager).mockImplementation(
      () => mockLockManager as any
    );

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/scheduled',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.summary.usersProcessed).toBe(1);
    expect(data.summary.totalGamesImported).toBe(5);
    expect(data.summary.totalGamesUpdated).toBe(2);
  });

  it('should skip users with sync disabled', async () => {
    const { resilientDB } = await import('@/lib/db-resilient');

    const mockUser = await createTestUser();

    vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
      const mockDb = {
        user: {
          findMany: vi.fn().mockResolvedValue([
            {
              ...mockUser,
              syncEnabled: false,
              players: [],
            },
          ]),
        },
      };
      return fn(mockDb as any);
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/scheduled',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.usersProcessed).toBe(0);
    expect(data.summary.usersSkipped).toBe(1);
  });

  it('should handle errors gracefully', async () => {
    const { resilientDB } = await import('@/lib/db-resilient');

    vi.mocked(resilientDB.execute).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/scheduled',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should require authentication when CRON_SECRET is set', async () => {
    const originalSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test-secret';

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/scheduled',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');

    if (originalSecret) {
      process.env.CRON_SECRET = originalSecret;
    } else {
      delete process.env.CRON_SECRET;
    }
  });
});
