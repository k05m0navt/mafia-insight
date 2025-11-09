import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock environment variable
const originalEnv = process.env.NODE_ENV;

describe('Test Players Route Gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('Production Mode', () => {
    it('should return 404 for test-players route in production', async () => {
      process.env.NODE_ENV = 'production';

      // Dynamically import to get fresh module with updated NODE_ENV
      const { GET } = await import('@/app/api/test-players/route');

      const request = new NextRequest('http://localhost:3000/api/test-players');
      const response = await GET(request);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Not found');
    });

    it('should return 404 for test-players/[id]/analytics route in production', async () => {
      process.env.NODE_ENV = 'production';

      const { GET } = await import(
        '@/app/api/test-players/[id]/analytics/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/test-players/player-1/analytics'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: 'player-1' }),
      });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Not found');
    });

    it('should return 404 for test-db route in production', async () => {
      process.env.NODE_ENV = 'production';

      const { GET } = await import('@/app/api/test-db/route');

      const request = new NextRequest('http://localhost:3000/api/test-db');
      const response = await GET(request);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Not found');
    });
  });

  describe('Development Mode', () => {
    it('should allow access to test-players route in development', async () => {
      process.env.NODE_ENV = 'development';

      const { GET } = await import('@/app/api/test-players/route');

      const request = new NextRequest('http://localhost:3000/api/test-players');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('pagination');
    });

    it('should allow access to test-players/[id]/analytics route in development', async () => {
      process.env.NODE_ENV = 'development';

      const { GET } = await import(
        '@/app/api/test-players/[id]/analytics/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/test-players/player-1/analytics'
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: 'player-1' }),
      });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toHaveProperty('player');
      expect(json).toHaveProperty('totalGames');
      expect(json).toHaveProperty('winRate');
    });

    it('should allow access to test-db route in development', async () => {
      process.env.NODE_ENV = 'development';

      // Mock Supabase
      vi.mock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      }));

      const { GET } = await import('@/app/api/test-db/route');

      const request = new NextRequest('http://localhost:3000/api/test-db');
      const response = await GET(request);

      // Should not return 404 (will return actual response or error)
      expect(response.status).not.toBe(404);
    });
  });
});
