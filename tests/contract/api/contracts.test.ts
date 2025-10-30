import { describe, it, expect } from 'vitest';

describe('API Contract Tests', () => {
  describe('Players API Contract', () => {
    it('should match GET /api/players schema', async () => {
      const response = await fetch('/api/players');
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('players');
      expect(Array.isArray(data.players)).toBe(true);

      if (data.players.length > 0) {
        const player = data.players[0];
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('name');
        expect(player).toHaveProperty('rating');
      }
    });

    it('should match POST /api/players schema', async () => {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Player',
          email: 'test@example.com',
          rating: 1500,
        }),
      });

      const data = await response.json();

      expect(data).toHaveProperty('player');
      expect(data.player).toHaveProperty('id');
      expect(data.player).toHaveProperty('name');
      expect(data.player).toHaveProperty('email');
      expect(data.player).toHaveProperty('rating');
    });
  });

  describe('Analytics API Contract', () => {
    it('should match GET /api/analytics/leaderboard schema', async () => {
      const response = await fetch('/api/analytics/leaderboard');
      const data = await response.json();

      expect(data).toHaveProperty('leaderboard');
      expect(Array.isArray(data.leaderboard)).toBe(true);
    });
  });

  describe('Import API Contract', () => {
    it('should match POST /api/import/start schema', async () => {
      const response = await fetch('/api/import/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'gomafia',
          options: {},
        }),
      });

      const data = await response.json();

      expect(data).toHaveProperty('importId');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('startTime');
    });
  });

  describe('Error Response Contract', () => {
    it('should match error response schema', async () => {
      const response = await fetch('/api/nonexistent');
      const data = await response.json();

      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');

      expect(typeof data.code).toBe('string');
      expect(typeof data.message).toBe('string');
      expect(typeof data.timestamp).toBe('string');
    });
  });

  describe('Pagination Contract', () => {
    it('should match pagination response schema', async () => {
      const response = await fetch('/api/players?page=1&limit=10');
      const data = await response.json();

      expect(data).toHaveProperty('pagination');
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('totalPages');
    });
  });
});
