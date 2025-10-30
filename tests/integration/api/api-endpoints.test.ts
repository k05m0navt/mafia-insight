import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestServer } from '../utils/test-server';

describe('API Endpoints Integration', () => {
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

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
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
        expect(data.user.email).toBe('test@example.com');
      });

      it('should reject invalid credentials', async () => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword',
          }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data).toHaveProperty('error', 'Invalid credentials');
      });

      it('should validate required fields', async () => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            // Missing password
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data.error).toContain('password');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout successfully', async () => {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('message', 'Logged out successfully');
      });

      it('should handle logout without token', async () => {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
        });

        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/auth/refresh', () => {
      it('should refresh token successfully', async () => {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-refresh-token',
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('token');
        expect(data).toHaveProperty('refreshToken');
      });

      it('should reject invalid refresh token', async () => {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer invalid-refresh-token',
          },
        });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Analytics Endpoints', () => {
    describe('GET /api/analytics/players/:id/stats', () => {
      it('should return player statistics', async () => {
        const response = await fetch('/api/analytics/players/123/stats', {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('playerId', '123');
        expect(data).toHaveProperty('gamesPlayed');
        expect(data).toHaveProperty('winRate');
        expect(data).toHaveProperty('elo');
      });

      it('should return 404 for non-existent player', async () => {
        const response = await fetch('/api/analytics/players/999/stats', {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        });

        expect(response.status).toBe(404);
      });

      it('should require authentication', async () => {
        const response = await fetch('/api/analytics/players/123/stats');
        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/analytics/clubs/:id/stats', () => {
      it('should return club statistics', async () => {
        const response = await fetch('/api/analytics/clubs/club-123/stats', {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('clubId', 'club-123');
        expect(data).toHaveProperty('members');
        expect(data).toHaveProperty('averageElo');
        expect(data).toHaveProperty('tournamentsWon');
      });
    });

    describe('GET /api/analytics/tournaments/:id/stats', () => {
      it('should return tournament statistics', async () => {
        const response = await fetch(
          '/api/analytics/tournaments/tourney-123/stats',
          {
            headers: {
              Authorization: 'Bearer valid-token',
            },
          }
        );

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('tournamentId', 'tourney-123');
        expect(data).toHaveProperty('participants');
        expect(data).toHaveProperty('averageGameDuration');
        expect(data).toHaveProperty('winnerId');
      });
    });
  });

  describe('Import Endpoints', () => {
    describe('POST /api/import/start', () => {
      it('should start import process', async () => {
        const response = await fetch('/api/import/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({
            source: 'gomafia',
            options: {
              batchSize: 100,
              concurrency: 5,
            },
          }),
        });

        expect(response.status).toBe(202);
        const data = await response.json();
        expect(data).toHaveProperty('importId');
        expect(data).toHaveProperty('status', 'started');
      });

      it('should validate import parameters', async () => {
        const response = await fetch('/api/import/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-token',
          },
          body: JSON.stringify({
            source: 'invalid-source',
            options: {
              batchSize: -1,
            },
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toHaveProperty('error');
      });
    });

    describe('GET /api/import/status/:id', () => {
      it('should return import status', async () => {
        const response = await fetch('/api/import/status/import-123', {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('importId', 'import-123');
        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('progress');
        expect(data).toHaveProperty('imported');
        expect(data).toHaveProperty('total');
      });
    });
  });

  describe('Data Synchronization Endpoints', () => {
    describe('GET /api/sync/status', () => {
      it('should return sync status', async () => {
        const response = await fetch('/api/sync/status', {
          headers: {
            Authorization: 'Bearer valid-token',
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('status');
        expect(data).toHaveProperty('lastSync');
        expect(data).toHaveProperty('nextSync');
      });
    });

    describe('POST /api/sync/start', () => {
      it('should start synchronization', async () => {
        const response = await fetch('/api/sync/start', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-token',
          },
        });

        expect(response.status).toBe(202);
        const data = await response.json();
        expect(data).toHaveProperty('syncId');
        expect(data).toHaveProperty('status', 'started');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 400 Bad Request', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });

    it('should handle 401 Unauthorized', async () => {
      const response = await fetch('/api/analytics/players/123/stats');
      expect(response.status).toBe(401);
    });

    it('should handle 403 Forbidden', async () => {
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: 'Bearer user-token',
        },
      });
      expect(response.status).toBe(403);
    });

    it('should handle 404 Not Found', async () => {
      const response = await fetch('/api/non-existent-endpoint');
      expect(response.status).toBe(404);
    });

    it('should handle 429 Too Many Requests', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(11)
        .fill(null)
        .map(() =>
          fetch('/api/analytics/players/123/stats', {
            headers: {
              Authorization: 'Bearer valid-token',
            },
          })
        );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find((r) => r.status === 429);

      expect(rateLimitedResponse).toBeDefined();
      if (rateLimitedResponse) {
        const data = await rateLimitedResponse.json();
        expect(data).toHaveProperty('error', 'Too many requests');
      }
    });

    it('should handle 500 Internal Server Error', async () => {
      const response = await fetch('/api/error-test', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });
      expect(response.status).toBe(500);
    });
  });

  describe('Request Validation', () => {
    it('should validate JSON content type', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(400);
    });

    it('should validate required headers', async () => {
      const response = await fetch('/api/analytics/players/123/stats');
      expect(response.status).toBe(401);
    });

    it('should validate request body size', async () => {
      const largeBody = 'x'.repeat(1000000); // 1MB
      const response = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ data: largeBody }),
      });

      expect(response.status).toBe(413);
    });
  });

  describe('Response Format', () => {
    it('should return consistent error format', async () => {
      const response = await fetch('/api/non-existent-endpoint');
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
    });

    it('should return consistent success format', async () => {
      const response = await fetch('/api/analytics/players/123/stats', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });
      const data = await response.json();

      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('timestamp');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const startTime = Date.now();

      const response = await fetch('/api/analytics/players/123/stats', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
      expect(response.status).toBe(200);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() =>
          fetch('/api/analytics/players/123/stats', {
            headers: {
              Authorization: 'Bearer valid-token',
            },
          })
        );

      const responses = await Promise.all(requests);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Caching', () => {
    it('should return cache headers for cacheable responses', async () => {
      const response = await fetch('/api/analytics/players/123/stats', {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBeTruthy();
    });

    it('should respect cache headers', async () => {
      const response = await fetch('/api/analytics/players/123/stats', {
        headers: {
          Authorization: 'Bearer valid-token',
          'If-None-Match': 'etag-value',
        },
      });

      // Should return 304 Not Modified if etag matches
      expect([200, 304]).toContain(response.status);
    });
  });
});
