import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestServer } from '../utils/test-server';

describe('Regression Integration Tests', () => {
  let server: any;

  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    // Reset test database
    await server.resetDatabase();
  });

  describe('Authentication Regression', () => {
    it('should maintain login API functionality', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email', 'test@example.com');
    });

    it('should maintain logout API functionality', async () => {
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const loginData = await loginResponse.json();
      const token = loginData.token;

      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(logoutResponse.status).toBe(200);
      const data = await logoutResponse.json();
      expect(data).toHaveProperty('success', true);
    });

    it('should maintain registration API functionality', async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email', 'newuser@example.com');
    });

    it('should maintain password reset API functionality', async () => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
    });

    it('should maintain token refresh API functionality', async () => {
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const loginData = await loginResponse.json();
      const token = loginData.token;

      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(refreshResponse.status).toBe(200);
      const data = await refreshResponse.json();
      expect(data).toHaveProperty('token');
    });
  });

  describe('Analytics Regression', () => {
    it('should maintain player statistics API functionality', async () => {
      const response = await fetch('/api/analytics/players/stats');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalPlayers');
      expect(data).toHaveProperty('activePlayers');
      expect(data).toHaveProperty('averageRating');
      expect(data).toHaveProperty('ratingDistribution');
    });

    it('should maintain tournament analytics API functionality', async () => {
      const response = await fetch('/api/analytics/tournaments/stats');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalTournaments');
      expect(data).toHaveProperty('completedTournaments');
      expect(data).toHaveProperty('averageParticipants');
      expect(data).toHaveProperty('tournamentTimeline');
    });

    it('should maintain club analytics API functionality', async () => {
      const response = await fetch('/api/analytics/clubs/stats');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalClubs');
      expect(data).toHaveProperty('activeClubs');
      expect(data).toHaveProperty('averageMembers');
      expect(data).toHaveProperty('clubGrowth');
    });

    it('should maintain data export API functionality', async () => {
      const response = await fetch('/api/analytics/export/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'players',
          format: 'csv',
        }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
    });

    it('should maintain real-time updates API functionality', async () => {
      const response = await fetch('/api/analytics/realtime/subscribe');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('subscriptionId');
      expect(data).toHaveProperty('endpoint');
    });
  });

  describe('Import Regression', () => {
    it('should maintain file upload API functionality', async () => {
      const formData = new FormData();
      formData.append(
        'file',
        new Blob(['test,data\n1,2'], { type: 'text/csv' }),
        'test.csv'
      );

      const response = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData,
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('fileId');
      expect(data).toHaveProperty('fileName', 'test.csv');
      expect(data).toHaveProperty('fileSize');
    });

    it('should maintain data validation API functionality', async () => {
      const response = await fetch('/api/import/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: 'test-file-id',
          validationRules: ['required', 'type', 'range'],
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('valid');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('warnings');
    });

    it('should maintain import process API functionality', async () => {
      const response = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: 'test-file-id',
          mapping: {
            name: 'player_name',
            rating: 'player_rating',
            club: 'club_name',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('importId');
      expect(data).toHaveProperty('status', 'started');
    });

    it('should maintain import progress API functionality', async () => {
      const response = await fetch('/api/import/progress/test-import-id');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('importId', 'test-import-id');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('progress');
      expect(data).toHaveProperty('processed');
      expect(data).toHaveProperty('total');
    });

    it('should maintain import history API functionality', async () => {
      const response = await fetch('/api/import/history');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('imports');
      expect(Array.isArray(data.imports)).toBe(true);

      if (data.imports.length > 0) {
        const importItem = data.imports[0];
        expect(importItem).toHaveProperty('id');
        expect(importItem).toHaveProperty('fileName');
        expect(importItem).toHaveProperty('status');
        expect(importItem).toHaveProperty('createdAt');
      }
    });

    it('should maintain rollback API functionality', async () => {
      const response = await fetch('/api/import/rollback/test-import-id', {
        method: 'POST',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('rollbackId');
    });
  });

  describe('API Regression', () => {
    it('should maintain all endpoints functionality', async () => {
      const endpoints = [
        '/api/health',
        '/api/version',
        '/api/status',
        '/api/metrics',
        '/api/config',
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint);
        expect(response.status).toBe(200);
      }
    });

    it('should maintain error handling functionality', async () => {
      const response = await fetch('/api/nonexistent-endpoint');
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });

    it('should maintain rate limiting functionality', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => fetch('/api/analytics/players/stats'));

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find((r) => r.status === 429);

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.status).toBe(429);
        const data = await rateLimitedResponse.json();
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('retryAfter');
      }
    });

    it('should maintain authentication middleware functionality', async () => {
      const response = await fetch('/api/analytics/players/stats', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Unauthorized');
    });

    it('should maintain validation middleware functionality', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'short',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('validationErrors');
    });
  });

  describe('Database Regression', () => {
    it('should maintain database connection functionality', async () => {
      const response = await fetch('/api/health/database');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('connection');
      expect(data).toHaveProperty('responseTime');
    });

    it('should maintain data integrity functionality', async () => {
      const response = await fetch('/api/health/data-integrity');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('checks');
      expect(Array.isArray(data.checks)).toBe(true);
    });

    it('should maintain migration functionality', async () => {
      const response = await fetch('/api/health/migrations');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('migrations');
      expect(Array.isArray(data.migrations)).toBe(true);
    });
  });

  describe('Performance Regression', () => {
    it('should maintain response time performance', async () => {
      const startTime = Date.now();
      const response = await fetch('/api/analytics/players/stats');
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // 1 second
    });

    it('should maintain memory usage performance', async () => {
      const response = await fetch('/api/health/memory');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('used');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('percentage');
      expect(data.percentage).toBeLessThan(80); // 80%
    });

    it('should maintain concurrent request performance', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => fetch('/api/analytics/players/stats'));

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Security Regression', () => {
    it('should maintain CORS functionality', async () => {
      const response = await fetch('/api/analytics/players/stats', {
        headers: {
          Origin: 'https://example.com',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });

    it('should maintain CSRF protection functionality', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('csrfToken');
    });

    it('should maintain input sanitization functionality', async () => {
      const response = await fetch('/api/analytics/players/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '<script>alert("xss")</script>',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(data.query).not.toContain('<script>');
    });
  });
});
