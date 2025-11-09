import { test, expect } from '@playwright/test';

test.describe('Test Routes Gating', () => {
  test.describe('Production Mode', () => {
    test.use({
      env: { NODE_ENV: 'production' },
    });

    test('should return 404 for /api/test-players in production', async ({
      request,
    }) => {
      const response = await request.get('/api/test-players');
      expect(response.status()).toBe(404);

      const json = await response.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toBe('Not found');
    });

    test('should return 404 for /api/test-players/[id]/analytics in production', async ({
      request,
    }) => {
      const response = await request.get(
        '/api/test-players/player-1/analytics'
      );
      expect(response.status()).toBe(404);

      const json = await response.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toBe('Not found');
    });

    test('should return 404 for /api/test-db in production', async ({
      request,
    }) => {
      const response = await request.get('/api/test-db');
      expect(response.status()).toBe(404);

      const json = await response.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toBe('Not found');
    });

    test('should return 404 for /test-players page in production', async ({
      page,
    }) => {
      const response = await page.goto('/test-players');
      expect(response?.status()).toBe(404);
    });

    test('should return 404 for /test-players/[id] page in production', async ({
      page,
    }) => {
      const response = await page.goto('/test-players/player-1');
      expect(response?.status()).toBe(404);
    });
  });

  test.describe('Development Mode', () => {
    test.use({
      env: { NODE_ENV: 'development' },
    });

    test('should allow access to /api/test-players in development', async ({
      request,
    }) => {
      const response = await request.get('/api/test-players');
      expect(response.status()).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('pagination');
    });

    test('should allow access to /api/test-players/[id]/analytics in development', async ({
      request,
    }) => {
      const response = await request.get(
        '/api/test-players/player-1/analytics'
      );
      expect(response.status()).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty('analytics');
    });

    test('should allow access to /api/test-db in development', async ({
      request,
    }) => {
      const response = await request.get('/api/test-db');
      // Should not be 404 (may return actual response or error)
      expect(response.status()).not.toBe(404);
    });

    test('should allow access to /test-players page in development', async ({
      page,
    }) => {
      await page.goto('/test-players');
      // Should not be 404 page
      await expect(page.locator('body')).not.toContainText('404');
    });

    test('should allow access to /test-players/[id] page in development', async ({
      page,
    }) => {
      await page.goto('/test-players/player-1');
      // Should not be 404 page
      await expect(page.locator('body')).not.toContainText('404');
    });
  });

  test.describe('E2E Test Access', () => {
    test('E2E tests should be able to access test routes in development mode', async ({
      request,
    }) => {
      // This test verifies that E2E tests can still access test routes
      // when running in development mode (which is the default for local E2E tests)

      const response = await request.get('/api/test-players');
      expect(response.status()).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty('data');
    });
  });
});
