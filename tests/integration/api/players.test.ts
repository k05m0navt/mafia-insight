import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { GET, POST } from '../../../src/app/api/players/route';

// Mock the database
vi.mock('../../../src/lib/db', () => ({
  prisma: {
    player: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: '1', name: 'Test Player' }),
    },
  },
}));

describe('/api/players', () => {
  describe('GET /api/players', () => {
    it('should return players list', async () => {
      const request = new Request(
        'http://localhost:3000/api/players?page=1&limit=20'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter players by search term', async () => {
      const request = new Request(
        'http://localhost:3000/api/players?search=John&page=1&limit=20'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
    });

    it('should filter players by club', async () => {
      const request = new Request(
        'http://localhost:3000/api/players?club_id=club-1&page=1&limit=20'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
    });

    it('should handle pagination', async () => {
      const request = new Request(
        'http://localhost:3000/api/players?page=2&limit=10'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
    });

    it('should handle errors gracefully', async () => {
      const request = new Request('http://localhost:3000/api/players');

      const response = await GET(request);

      // Should not throw, should return error response
      expect(response.status).toBeDefined();
    });
  });

  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      const playerData = {
        gomafiaId: 'gm-123',
        name: 'Test Player',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
        userId: 'user-1',
      };

      const request = new Request('http://localhost:3000/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('Test Player');
    });

    it('should validate required fields', async () => {
      const request = new Request('http://localhost:3000/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
          name: 'Test Player',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should require userId', async () => {
      const playerData = {
        gomafiaId: 'gm-123',
        name: 'Test Player',
        eloRating: 1200,
        totalGames: 0,
        wins: 0,
        losses: 0,
      };

      const request = new Request('http://localhost:3000/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData), // Missing userId
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate player data', async () => {
      const invalidData = {
        gomafiaId: '',
        name: 'A', // Too short
        eloRating: -100, // Invalid
        totalGames: 5,
        wins: 3,
        losses: 1, // Doesn't add up
        userId: 'user-1',
      };

      const request = new Request('http://localhost:3000/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
