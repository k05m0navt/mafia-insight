import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock environment variable
const originalEnv = process.env.NODE_ENV;

describe('Environment-Based Route Gating Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Production Environment', () => {
    it('should gate all test routes in production', async () => {
      process.env.NODE_ENV = 'production';

      // Test all test routes
      const testRoutes = [
        {
          path: '/api/test-players',
          handler: () => import('@/app/api/test-players/route'),
        },
        {
          path: '/api/test-db',
          handler: () => import('@/app/api/test-db/route'),
        },
        {
          path: '/api/test-players/player-1/analytics',
          handler: () => import('@/app/api/test-players/[id]/analytics/route'),
          params: { id: 'player-1' },
        },
      ];

      for (const route of testRoutes) {
        const module = await route.handler();
        const { GET } = module;

        const request = new NextRequest(`http://localhost:3000${route.path}`);
        const response =
          'params' in route && route.params
            ? await GET(request, { params: Promise.resolve(route.params) })
            : await GET(request);

        expect(response.status).toBe(404);
        const json = await response.json();
        expect(json.error).toBe('Not found');
      }
    });
  });

  describe('Development Environment', () => {
    it('should allow access to test routes in development', async () => {
      process.env.NODE_ENV = 'development';

      // Mock Supabase for test-db route
      vi.mock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      }));

      // Test test-players route
      const { GET: getTestPlayers } = await import(
        '@/app/api/test-players/route'
      );
      const request1 = new NextRequest(
        'http://localhost:3000/api/test-players'
      );
      const response1 = await getTestPlayers(request1);

      expect(response1.status).toBe(200);
      const json1 = await response1.json();
      expect(json1).toHaveProperty('data');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle undefined NODE_ENV gracefully', async () => {
      delete process.env.NODE_ENV;

      // Should default to allowing access (development behavior)
      const { GET } = await import('@/app/api/test-players/route');
      const request = new NextRequest('http://localhost:3000/api/test-players');
      const response = await GET(request);

      // Without NODE_ENV, should default to development behavior
      expect(response.status).toBe(200);
    });

    it('should handle test environment correctly', async () => {
      process.env.NODE_ENV = 'test';

      // Test environment should allow access (for E2E tests)
      const { GET } = await import('@/app/api/test-players/route');
      const request = new NextRequest('http://localhost:3000/api/test-players');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
