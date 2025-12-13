import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gomafia-sync/status/route';
import { createTestUser } from '../../setup';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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

describe('User Sync Status API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return sync status for authenticated user', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { resilientDB } = await import('@/lib/db-resilient');

    const mockUser = await createTestUser();
    const mockAuthUser = {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      },
    };

    vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);

    vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
      const mockDb = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: mockUser.id,
            syncEnabled: true,
            syncSchedule: 'daily',
            lastSyncAt: new Date('2024-01-01T00:00:00Z'),
          }),
        },
        syncStatus: {
          findUnique: vi.fn().mockResolvedValue({
            id: `user-${mockUser.id}`,
            isRunning: false,
            progress: 100,
            currentOperation: null,
            lastSyncTime: new Date('2024-01-01T00:00:00Z'),
            lastSyncType: 'INCREMENTAL',
            lastError: null,
          }),
        },
        syncLog: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'log-1',
              type: 'INCREMENTAL',
              status: 'COMPLETED',
              startTime: new Date('2024-01-01T00:00:00Z'),
              endTime: new Date('2024-01-01T01:00:00Z'),
              recordsProcessed: 10,
              errors: null,
            },
          ]),
        },
      };
      return fn(mockDb as any);
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/status'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.userId).toBe(mockUser.id);
    expect(data.syncEnabled).toBe(true);
    expect(data.syncSchedule).toBe('daily');
    expect(data.syncStatus).toBeDefined();
    expect(data.syncLogs).toBeDefined();
    expect(data.syncLogs.length).toBe(1);
  });

  it('should return 401 for unauthenticated requests', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');

    vi.mocked(authenticateRequest).mockRejectedValue(
      new Error('Authentication required')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/status'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it('should handle missing sync status gracefully', async () => {
    const { authenticateRequest } = await import('@/lib/apiAuth');
    const { resilientDB } = await import('@/lib/db-resilient');

    const mockUser = await createTestUser();
    const mockAuthUser = {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      },
    };

    vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);

    vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
      const mockDb = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: mockUser.id,
            syncEnabled: false,
            syncSchedule: null,
            lastSyncAt: null,
          }),
        },
        syncStatus: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        syncLog: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };
      return fn(mockDb as any);
    });

    const request = new NextRequest(
      'http://localhost:3000/api/gomafia-sync/status'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.syncStatus).toBeNull();
    expect(data.syncLogs).toEqual([]);
  });
});
