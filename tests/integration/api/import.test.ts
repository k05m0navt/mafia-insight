import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestServer } from '../utils/test-server';

describe('Import API Integration', () => {
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

  describe('POST /api/import/start', () => {
    it('should start import process successfully', async () => {
      const response = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: {
            batchSize: 100,
            concurrency: 5,
            retryAttempts: 3,
          },
        }),
      });

      expect(response.status).toBe(202);
      const data = await response.json();
      expect(data).toHaveProperty('importId');
      expect(data).toHaveProperty('status', 'started');
      expect(data).toHaveProperty('estimatedDuration');
    });

    it('should validate import parameters', async () => {
      const response = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'invalid-source',
          options: {
            batchSize: -1,
            concurrency: 0,
          },
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid parameters');
    });

    it('should handle concurrent import conflicts', async () => {
      // Start first import
      const response1 = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      expect(response1.status).toBe(202);

      // Try to start second import
      const response2 = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      expect(response2.status).toBe(409);
      const data = await response2.json();
      expect(data).toHaveProperty('error', 'Import already in progress');
    });
  });

  describe('GET /api/import/status/:importId', () => {
    it('should return import status', async () => {
      // Start import
      const startResponse = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      const { importId } = await startResponse.json();

      // Get status
      const response = await fetch(`/api/import/status/${importId}`, {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('progress');
      expect(data).toHaveProperty('imported');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('errors');
    });

    it('should return 404 for non-existent import', async () => {
      const response = await fetch('/api/import/status/non-existent-id', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/import/pause/:importId', () => {
    it('should pause import process', async () => {
      // Start import
      const startResponse = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      const { importId } = await startResponse.json();

      // Pause import
      const response = await fetch(`/api/import/pause/${importId}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'paused');
    });
  });

  describe('POST /api/import/resume/:importId', () => {
    it('should resume paused import', async () => {
      // Start and pause import
      const startResponse = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      const { importId } = await startResponse.json();

      await fetch(`/api/import/pause/${importId}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      // Resume import
      const response = await fetch(`/api/import/resume/${importId}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'importing');
    });
  });

  describe('POST /api/import/stop/:importId', () => {
    it('should stop import process', async () => {
      // Start import
      const startResponse = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      const { importId } = await startResponse.json();

      // Stop import
      const response = await fetch(`/api/import/stop/${importId}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'stopped');
    });
  });

  describe('GET /api/import/logs/:importId', () => {
    it('should return import logs', async () => {
      // Start import
      const startResponse = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      const { importId } = await startResponse.json();

      // Get logs
      const response = await fetch(`/api/import/logs/${importId}`, {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('logs');
      expect(Array.isArray(data.logs)).toBe(true);
    });

    it('should support log filtering', async () => {
      // Start import
      const startResponse = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      const { importId } = await startResponse.json();

      // Get filtered logs
      const response = await fetch(
        `/api/import/logs/${importId}?level=error&limit=10`,
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('logs');
      expect(data.logs.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/import/history', () => {
    it('should return import history', async () => {
      const response = await fetch('/api/import/history', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('imports');
      expect(Array.isArray(data.imports)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await fetch('/api/import/history?page=1&limit=10', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('imports');
      expect(data).toHaveProperty('pagination');
      expect(data.pagination).toHaveProperty('page', 1);
      expect(data.pagination).toHaveProperty('limit', 10);
    });
  });

  describe('POST /api/import/validate', () => {
    it('should validate import data', async () => {
      const response = await fetch('/api/import/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          data: {
            players: [
              { name: 'Player 1', email: 'player1@example.com', rating: 1500 },
              { name: 'Player 2', email: 'player2@example.com', rating: 1600 },
            ],
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('valid', true);
      expect(data).toHaveProperty('errors', []);
      expect(data).toHaveProperty('warnings', []);
    });

    it('should detect validation errors', async () => {
      const response = await fetch('/api/import/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          data: {
            players: [
              { name: '', email: 'invalid-email', rating: -100 },
              { name: 'Player 2', email: 'player2@example.com', rating: 5000 },
            ],
          },
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('valid', false);
      expect(data).toHaveProperty('errors');
      expect(data.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/import/retry/:importId', () => {
    it('should retry failed import', async () => {
      // Start and fail import
      const startResponse = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      const { importId } = await startResponse.json();

      // Simulate failure
      await fetch(`/api/import/stop/${importId}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      // Retry import
      const response = await fetch(`/api/import/retry/${importId}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'importing');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const response = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'gomafia',
          options: { batchSize: 100 },
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(11)
        .fill(null)
        .map(() =>
          fetch('/api/import/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              source: 'gomafia',
              options: { batchSize: 100 },
            }),
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

    it('should handle server errors gracefully', async () => {
      // Mock server error
      const response = await fetch('/api/import/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          source: 'error-source',
          options: { batchSize: 100 },
        }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
    });
  });
});
