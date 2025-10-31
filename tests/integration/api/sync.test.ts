import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { clearTestDatabase, createTestAdmin } from '../../setup';

/**
 * Sync API Integration Tests
 *
 * Tests sync-related API endpoints including manual triggers
 * and integrity verification
 */

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createRouteHandlerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-user-id', email: 'admin@test.com' } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      })),
    })
  ),
}));

// Mock verification service
vi.mock('@/services/sync/verificationService', () => ({
  runDataVerification: vi.fn().mockResolvedValue({
    timestamp: new Date(),
    overallAccuracy: 98.5,
    entities: {
      players: { total: 100, sampled: 1, matched: 1, accuracy: 100 },
      clubs: { total: 10, sampled: 1, matched: 1, accuracy: 100 },
      tournaments: { total: 5, sampled: 1, matched: 0, accuracy: 0 },
    },
    discrepancies: {
      players: [],
      clubs: [],
      tournaments: [
        {
          id: 'test',
          type: 'tournament' as const,
          field: 'name',
          expected: 'A',
          actual: 'B',
          severity: 'LOW' as const,
        },
      ],
    },
    sampleStrategy: '1_percent',
    triggerType: 'MANUAL' as const,
    status: 'COMPLETED' as const,
    completedAt: new Date(),
  }),
  getVerificationHistory: vi.fn().mockResolvedValue({
    reports: [],
    total: 0,
  }),
}));

// Mock notification service
vi.mock('@/services/sync/notificationService', () => ({
  sendAdminAlerts: vi.fn().mockResolvedValue(undefined),
}));

describe('Sync API Integration', () => {
  beforeEach(async () => {
    await clearTestDatabase();
    vi.clearAllMocks();
  });

  describe('POST /api/gomafia-sync/integrity/verify', () => {
    it('should require authentication', async () => {
      const { POST } = await import(
        '@/app/api/gomafia-sync/integrity/verify/route'
      );

      // Mock unauthenticated request
      const { createRouteHandlerClient } = await import(
        '@/lib/supabase/server'
      );
      vi.mocked(createRouteHandlerClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/verify',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const { POST } = await import(
        '@/app/api/gomafia-sync/integrity/verify/route'
      );
      const { prisma } = await import('@/lib/db');

      // Create non-admin user
      await createTestAdmin({ email: 'user@test.com' });

      // Mock user with non-admin role
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-id',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
        subscriptionTier: 'FREE',
        avatar: null,
        themePreference: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/verify',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should trigger data verification', async () => {
      const { runDataVerification } = await import(
        '@/services/sync/verificationService'
      );
      const { POST } = await import(
        '@/app/api/gomafia-sync/integrity/verify/route'
      );

      await createTestAdmin({ email: 'admin@test.com' });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/verify',
        {
          method: 'POST',
        }
      );

      await POST(request);

      expect(runDataVerification).toHaveBeenCalledWith('MANUAL');
    });

    it('should return verification report', async () => {
      const { POST } = await import(
        '@/app/api/gomafia-sync/integrity/verify/route'
      );

      await createTestAdmin({ email: 'admin@test.com' });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/verify',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.report).toBeDefined();
      expect(body.report.overallAccuracy).toBeGreaterThanOrEqual(0);
    });

    it('should send alert if accuracy below threshold', async () => {
      const { runDataVerification } = await import(
        '@/services/sync/verificationService'
      );
      const { sendAdminAlerts } = await import(
        '@/services/sync/notificationService'
      );

      // Mock low accuracy
      vi.mocked(runDataVerification).mockResolvedValueOnce({
        timestamp: new Date(),
        overallAccuracy: 85, // Below 95% threshold
        entities: {
          players: { total: 100, sampled: 1, matched: 0, accuracy: 0 },
          clubs: { total: 10, sampled: 1, matched: 1, accuracy: 100 },
          tournaments: { total: 5, sampled: 1, matched: 1, accuracy: 100 },
        },
        sampleStrategy: '1_percent',
        triggerType: 'MANUAL',
        status: 'FAILED',
        completedAt: new Date(),
      });

      const { POST } = await import(
        '@/app/api/gomafia-sync/integrity/verify/route'
      );

      await createTestAdmin({ email: 'admin@test.com' });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/verify',
        {
          method: 'POST',
        }
      );

      await POST(request);

      expect(sendAdminAlerts).toHaveBeenCalled();
    });
  });

  describe('GET /api/gomafia-sync/integrity/verify', () => {
    it('should return latest verification status', async () => {
      const { GET } = await import(
        '@/app/api/gomafia-sync/integrity/verify/route'
      );

      await createTestAdmin({ email: 'admin@test.com' });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/verify'
      );

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.latestReport).toBeDefined();
    });

    it('should require admin authentication', async () => {
      const { GET } = await import(
        '@/app/api/gomafia-sync/integrity/verify/route'
      );
      const { prisma } = await import('@/lib/db');

      // Mock non-admin
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-id',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
        subscriptionTier: 'FREE',
        avatar: null,
        themePreference: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/verify'
      );

      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/gomafia-sync/integrity/reports', () => {
    it('should return paginated report history', async () => {
      const { GET } = await import(
        '@/app/api/gomafia-sync/integrity/reports/route'
      );

      await createTestAdmin({ email: 'admin@test.com' });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/reports?page=1&limit=10'
      );

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.reports).toBeDefined();
      expect(body.total).toBeDefined();
      expect(body.page).toBe(1);
      expect(body.limit).toBe(10);
    });

    it('should support pagination parameters', async () => {
      const { getVerificationHistory } = await import(
        '@/services/sync/verificationService'
      );
      const { GET } = await import(
        '@/app/api/gomafia-sync/integrity/reports/route'
      );

      await createTestAdmin({ email: 'admin@test.com' });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/reports?page=2&limit=5'
      );

      await GET(request);

      expect(getVerificationHistory).toHaveBeenCalledWith(2, 5);
    });

    it('should use default pagination values', async () => {
      const { getVerificationHistory } = await import(
        '@/services/sync/verificationService'
      );
      const { GET } = await import(
        '@/app/api/gomafia-sync/integrity/reports/route'
      );

      await createTestAdmin({ email: 'admin@test.com' });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/reports'
      );

      await GET(request);

      expect(getVerificationHistory).toHaveBeenCalledWith(1, 10);
    });

    it('should require admin role', async () => {
      const { GET } = await import(
        '@/app/api/gomafia-sync/integrity/reports/route'
      );
      const { prisma } = await import('@/lib/db');

      // Mock non-admin
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-id',
        email: 'user@test.com',
        name: 'User',
        role: 'user',
        subscriptionTier: 'FREE',
        avatar: null,
        themePreference: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/reports'
      );

      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle verification service errors', async () => {
      const { runDataVerification } = await import(
        '@/services/sync/verificationService'
      );
      vi.mocked(runDataVerification).mockRejectedValueOnce(
        new Error('Verification failed')
      );

      const { POST } = await import(
        '@/app/api/gomafia-sync/integrity/verify/route'
      );

      await createTestAdmin({ email: 'admin@test.com' });

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/verify',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should handle database errors gracefully', async () => {
      const { prisma } = await import('@/lib/db');
      vi.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(
        new Error('DB error')
      );

      const { GET } = await import(
        '@/app/api/gomafia-sync/integrity/reports/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/gomafia-sync/integrity/reports'
      );

      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
