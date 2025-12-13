import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/settings/sync/route';
import { createTestUser } from '../../setup';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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

describe('Sync Preferences API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/settings/sync', () => {
    it('should return sync preferences for authenticated user', async () => {
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
        };
        return fn(mockDb as any);
      });

      const request = new NextRequest(
        'http://localhost:3000/api/settings/sync'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.syncEnabled).toBe(true);
      expect(data.syncSchedule).toBe('daily');
      expect(data.lastSyncAt).toBeDefined();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');

      vi.mocked(authenticateRequest).mockRejectedValue(
        new Error('Authentication required')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/settings/sync'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/settings/sync', () => {
    it('should update sync preferences for authenticated user', async () => {
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

      const updatedUser = {
        id: mockUser.id,
        syncEnabled: true,
        syncSchedule: 'hourly',
        lastSyncAt: new Date('2024-01-01T00:00:00Z'),
      };

      vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
        const mockDb = {
          user: {
            update: vi.fn().mockResolvedValue(updatedUser),
          },
        };
        return fn(mockDb as any);
      });

      const request = new NextRequest(
        'http://localhost:3000/api/settings/sync',
        {
          method: 'POST',
          body: JSON.stringify({
            syncEnabled: true,
            syncSchedule: 'hourly',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.syncEnabled).toBe(true);
      expect(data.syncSchedule).toBe('hourly');
    });

    it('should validate request data', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');

      const mockUser = await createTestUser();
      const mockAuthUser = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);

      const request = new NextRequest(
        'http://localhost:3000/api/settings/sync',
        {
          method: 'POST',
          body: JSON.stringify({
            syncEnabled: 'invalid', // Should be boolean
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });
  });
});
