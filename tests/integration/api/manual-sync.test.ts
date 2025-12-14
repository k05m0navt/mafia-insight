import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gomafia-sync/manual/route';
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

describe('Manual Sync API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/gomafia-sync/manual', () => {
    it('should trigger manual sync successfully for authenticated user', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');
      const { resilientDB } = await import('@/lib/db-resilient');
      const { ImportOrchestrator } = await import(
        '@/lib/gomafia/import/import-orchestrator'
      );
      const { AdvisoryLockManager } = await import(
        '@/lib/gomafia/import/advisory-lock'
      );
      const { chromium } = await import('playwright');

      const mockUser = await createTestUser();
      const mockAuthUser = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      // Mock authentication
      vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);

      // Mock AdvisoryLock - lock acquired successfully
      const mockLockManager = {
        acquireLock: vi.fn().mockResolvedValue(true),
        releaseLock: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(AdvisoryLockManager).mockImplementation(
        () => mockLockManager as any
      );

      // Mock browser
      const mockBrowser = {
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

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

      // Mock ImportOrchestrator
      const mockOrchestrator = {
        syncIncremental: vi.fn().mockResolvedValue({
          gamesImported: 5,
          gamesUpdated: 3,
          errors: 0,
          success: true,
        }),
      };
      vi.mocked(ImportOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.gamesImported).toBe(5);
      expect(data.summary.gamesUpdated).toBe(3);
      expect(mockLockManager.acquireLock).toHaveBeenCalledWith(mockUser.id);
      expect(mockOrchestrator.syncIncremental).toHaveBeenCalled();
      expect(mockLockManager.releaseLock).toHaveBeenCalledWith(mockUser.id);
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');

      vi.mocked(authenticateRequest).mockRejectedValue(
        new Error('Authentication required')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
      expect(data.message).toContain('sign in');
    });

    it('should return 409 Conflict when sync is already in progress', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');
      const { AdvisoryLockManager } = await import(
        '@/lib/gomafia/import/advisory-lock'
      );

      const mockUser = await createTestUser();
      const mockAuthUser = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);

      // Mock AdvisoryLock - lock cannot be acquired (sync already running)
      const mockLockManager = {
        acquireLock: vi.fn().mockResolvedValue(false),
        releaseLock: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(AdvisoryLockManager).mockImplementation(
        () => mockLockManager as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already in progress');
      expect(mockLockManager.acquireLock).toHaveBeenCalledWith(mockUser.id);
      expect(mockLockManager.releaseLock).not.toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');
      const { resilientDB } = await import('@/lib/db-resilient');
      const { ImportOrchestrator } = await import(
        '@/lib/gomafia/import/import-orchestrator'
      );
      const { AdvisoryLockManager } = await import(
        '@/lib/gomafia/import/advisory-lock'
      );
      const { chromium } = await import('playwright');

      const mockUser = await createTestUser();
      const mockAuthUser = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);

      const mockLockManager = {
        acquireLock: vi.fn().mockResolvedValue(true),
        releaseLock: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(AdvisoryLockManager).mockImplementation(
        () => mockLockManager as any
      );

      const mockBrowser = {
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

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
      const mockOrchestrator = {
        syncIncremental: vi.fn().mockRejectedValue(new Error('Sync failed')),
      };
      vi.mocked(ImportOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Sync failed');
      expect(mockLockManager.releaseLock).toHaveBeenCalledWith(mockUser.id);
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should release lock even if sync fails', async () => {
      const { authenticateRequest } = await import('@/lib/apiAuth');
      const { resilientDB } = await import('@/lib/db-resilient');
      const { ImportOrchestrator } = await import(
        '@/lib/gomafia/import/import-orchestrator'
      );
      const { AdvisoryLockManager } = await import(
        '@/lib/gomafia/import/advisory-lock'
      );
      const { chromium } = await import('playwright');

      const mockUser = await createTestUser();
      const mockAuthUser = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      };

      vi.mocked(authenticateRequest).mockResolvedValue(mockAuthUser as any);

      const mockLockManager = {
        acquireLock: vi.fn().mockResolvedValue(true),
        releaseLock: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(AdvisoryLockManager).mockImplementation(
        () => mockLockManager as any
      );

      const mockBrowser = {
        close: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

      vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
        const mockDb = {
          user: {
            findUnique: vi.fn().mockResolvedValue({
              id: mockUser.id,
              lastSyncAt: null,
            }),
          },
        };
        return fn(mockDb as any);
      });

      const mockOrchestrator = {
        syncIncremental: vi.fn().mockRejectedValue(new Error('Network error')),
      };
      vi.mocked(ImportOrchestrator).mockImplementation(
        () => mockOrchestrator as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/manual',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      // Verify lock is released even on error
      expect(mockLockManager.releaseLock).toHaveBeenCalledWith(mockUser.id);
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
