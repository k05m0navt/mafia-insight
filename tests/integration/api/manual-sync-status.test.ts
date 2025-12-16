import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gomafia-sync/manual/status/route';
import { createTestUser } from '../../setup';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    syncStatus: {
      findUnique: vi.fn(),
    },
    syncLog: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/apiAuth', () => ({
  authenticateRequest: vi.fn(),
}));

describe('Manual Sync Status API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/gomafia-sync/manual/status', () => {
    it('should return sync status for authenticated user', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');
      const { prisma } = await import('@/lib/db');

      const mockUser = await createTestUser();
      const mockAuthUser = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);

      const mockSyncStatus = {
        id: `user-${mockUser.id}`,
        isRunning: false,
        progress: 100,
        currentOperation: null,
        lastSyncTime: new Date('2024-01-01T00:00:00Z'),
        lastSyncType: 'INCREMENTAL',
        lastError: null,
        updatedAt: new Date(),
      };

      const mockSyncLog = {
        id: 'sync-log-123',
        userId: mockUser.id,
        type: 'INCREMENTAL',
        status: 'COMPLETED',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T01:00:00Z'),
        recordsProcessed: 10,
        errors: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.syncStatus.findUnique).mockResolvedValue(
        mockSyncStatus as any
      );
      vi.mocked(prisma.syncLog.findFirst).mockResolvedValue(mockSyncLog as any);

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual/status'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isRunning).toBe(false);
      expect(data.progress).toBe(100);
      expect(data.lastSyncTime).toBe(mockSyncStatus.lastSyncTime.toISOString());
      expect(data.lastSyncType).toBe('INCREMENTAL');
      expect(data.syncLogId).toBe('sync-log-123');
      expect(data.syncLogStatus).toBe('COMPLETED');
      expect(prisma.syncStatus.findUnique).toHaveBeenCalledWith({
        where: { id: `user-${mockUser.id}` },
      });
    });

    it('should return running status when sync is in progress', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');
      const { prisma } = await import('@/lib/db');

      const mockUser = await createTestUser();
      const mockAuthUser = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);

      const mockSyncStatus = {
        id: `user-${mockUser.id}`,
        isRunning: true,
        progress: 50,
        currentOperation: 'Processing games...',
        lastSyncTime: null,
        lastSyncType: null,
        lastError: null,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.syncStatus.findUnique).mockResolvedValue(
        mockSyncStatus as any
      );
      vi.mocked(prisma.syncLog.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual/status'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isRunning).toBe(true);
      expect(data.progress).toBe(50);
      expect(data.currentOperation).toBe('Processing games...');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');

      vi.mocked(authenticateRequest).mockRejectedValue(
        new Error('Authentication required')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual/status'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should handle missing sync status gracefully', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');
      const { prisma } = await import('@/lib/db');

      const mockUser = await createTestUser();
      const mockAuthUser = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);
      vi.mocked(prisma.syncStatus.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.syncLog.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual/status'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isRunning).toBe(false);
      expect(data.progress).toBe(0);
      expect(data.currentOperation).toBeNull();
      expect(data.lastSyncTime).toBeNull();
    });

    it('should set cache control headers', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');
      const { prisma } = await import('@/lib/db');

      const mockUser = await createTestUser();
      const mockAuthUser = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);
      vi.mocked(prisma.syncStatus.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.syncLog.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual/status'
      );
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe(
        'no-store, no-cache, must-revalidate'
      );
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });
});
