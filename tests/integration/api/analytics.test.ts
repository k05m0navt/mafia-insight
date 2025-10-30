import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestServer } from '../utils/test-server';

describe('Analytics API Integration', () => {
  let server: any;

  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Player Analytics API', () => {
    it('should return player analytics data', async () => {
      const response = await fetch('/api/players/test-player-1/analytics');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('player');
      expect(data).toHaveProperty('statistics');
      expect(data).toHaveProperty('performanceTrend');
      expect(data).toHaveProperty('roleStats');
    });

    it('should filter player analytics by role', async () => {
      const response = await fetch(
        '/api/players/test-player-1/analytics?role=mafia'
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.roleStats).toBeDefined();
      expect(data.roleStats).toHaveProperty('mafia');
    });

    it('should filter player analytics by time period', async () => {
      const response = await fetch(
        '/api/players/test-player-1/analytics?period=last_month'
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.statistics).toBeDefined();
      expect(data.performanceTrend).toBeDefined();
    });

    it('should return 404 for non-existent player', async () => {
      const response = await fetch('/api/players/non-existent/analytics');
      expect(response.status).toBe(404);
    });

    it('should handle invalid role parameter', async () => {
      const response = await fetch(
        '/api/players/test-player-1/analytics?role=invalid'
      );
      expect(response.status).toBe(400);
    });
  });

  describe('Club Analytics API', () => {
    it('should return club analytics data', async () => {
      const response = await fetch('/api/clubs/test-club-1/analytics');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('club');
      expect(data).toHaveProperty('memberCount');
      expect(data).toHaveProperty('totalGames');
      expect(data).toHaveProperty('winRate');
      expect(data).toHaveProperty('averageElo');
      expect(data).toHaveProperty('roleDistribution');
      expect(data).toHaveProperty('topPerformers');
    });

    it('should return club member statistics', async () => {
      const response = await fetch('/api/clubs/test-club-1/analytics');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.club.players).toBeInstanceOf(Array);
      expect(data.club.players.length).toBeGreaterThan(0);

      // Check player data structure
      const player = data.club.players[0];
      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('name');
      expect(player).toHaveProperty('eloRating');
      expect(player).toHaveProperty('totalGames');
      expect(player).toHaveProperty('wins');
      expect(player).toHaveProperty('losses');
      expect(player).toHaveProperty('roleStats');
    });

    it('should return 404 for non-existent club', async () => {
      const response = await fetch('/api/clubs/non-existent/analytics');
      expect(response.status).toBe(404);
    });
  });

  describe('Tournament Analytics API', () => {
    it('should return tournament analytics data', async () => {
      const response = await fetch(
        '/api/tournaments/test-tournament-1/analytics'
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('tournament');
      expect(data).toHaveProperty('participantCount');
      expect(data).toHaveProperty('totalGames');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('prizePool');
      expect(data).toHaveProperty('standings');
      expect(data).toHaveProperty('games');
    });

    it('should return tournament standings', async () => {
      const response = await fetch(
        '/api/tournaments/test-tournament-1/analytics'
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.standings).toBeInstanceOf(Array);
      expect(data.standings.length).toBeGreaterThan(0);

      // Check standings data structure
      const standing = data.standings[0];
      expect(standing).toHaveProperty('rank');
      expect(standing).toHaveProperty('player');
      expect(standing).toHaveProperty('points');
      expect(standing).toHaveProperty('games');
      expect(standing).toHaveProperty('wins');
      expect(standing).toHaveProperty('losses');
    });

    it('should return tournament games history', async () => {
      const response = await fetch(
        '/api/tournaments/test-tournament-1/analytics'
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.games).toBeInstanceOf(Array);

      if (data.games.length > 0) {
        const game = data.games[0];
        expect(game).toHaveProperty('id');
        expect(game).toHaveProperty('players');
        expect(game).toHaveProperty('winner');
        expect(game).toHaveProperty('date');
        expect(game).toHaveProperty('duration');
      }
    });

    it('should return 404 for non-existent tournament', async () => {
      const response = await fetch('/api/tournaments/non-existent/analytics');
      expect(response.status).toBe(404);
    });
  });

  describe('General Analytics API', () => {
    it('should return overall statistics', async () => {
      const response = await fetch('/api/analytics/overview');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalPlayers');
      expect(data).toHaveProperty('totalClubs');
      expect(data).toHaveProperty('totalTournaments');
      expect(data).toHaveProperty('totalGames');
      expect(data).toHaveProperty('averageRating');
    });

    it('should return leaderboard data', async () => {
      const response = await fetch('/api/analytics/leaderboard');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('players');
      expect(data.players).toBeInstanceOf(Array);
      expect(data.players.length).toBeGreaterThan(0);

      // Check leaderboard data structure
      const player = data.players[0];
      expect(player).toHaveProperty('rank');
      expect(player).toHaveProperty('name');
      expect(player).toHaveProperty('rating');
      expect(player).toHaveProperty('games');
      expect(player).toHaveProperty('winRate');
    });

    it('should return role statistics', async () => {
      const response = await fetch('/api/analytics/roles');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('distribution');
      expect(data).toHaveProperty('performance');

      expect(data.distribution).toBeInstanceOf(Object);
      expect(data.performance).toBeInstanceOf(Object);
    });

    it('should handle date range filtering', async () => {
      const response = await fetch(
        '/api/analytics/overview?startDate=2024-01-01&endDate=2024-12-31'
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalPlayers');
      expect(data).toHaveProperty('totalGames');
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock server error by using invalid endpoint
      const response = await fetch('/api/analytics/invalid-endpoint');
      expect(response.status).toBe(404);
    });

    it('should return proper error messages', async () => {
      const response = await fetch('/api/players/invalid-id/analytics');
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });

    it('should handle malformed requests', async () => {
      const response = await fetch(
        '/api/analytics/overview?invalidParam=value'
      );
      expect(response.status).toBe(200); // Should ignore invalid params
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await fetch('/api/analytics/overview');
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => fetch('/api/analytics/overview'));

      const responses = await Promise.all(requests);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
