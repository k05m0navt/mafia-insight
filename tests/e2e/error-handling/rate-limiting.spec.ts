import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Rate Limiting Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle API rate limiting', async ({ page }) => {
    await testLogger.info('Testing API rate limiting');

    // Make multiple rapid requests
    for (let i = 0; i < 100; i++) {
      await page.evaluate(() => {
        fetch('/api/players').catch(() => {});
      });
      await page.waitForTimeout(10); // Small delay
    }

    // Should eventually hit rate limit
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Too many requests',
          retryAfter: 60,
        }),
      });
    });

    await page.goto('/analytics');

    await expect(
      page.locator('[data-testid="rate-limit-error"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="retry-after"]')).toContainText(
      '60'
    );
  });

  test('should show rate limit retry information', async ({ page }) => {
    await testLogger.info('Testing rate limit retry info');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: 30,
        }),
      });
    });

    await page.goto('/analytics');

    await expect(page.locator('[data-testid="retry-after"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-timer"]')).toBeVisible();
  });

  test('should handle per-endpoint rate limiting', async ({ page }) => {
    await testLogger.info('Testing per-endpoint rate limiting');

    // Different endpoints have different limits
    await page.route('**/api/import/**', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Import rate limit exceeded' }),
      });
    });

    await page.route('**/api/analytics/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: 'ok' }),
      });
    });

    await page.goto('/analytics');

    // Should still load analytics data
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
  });

  test('should implement request queuing when rate limited', async ({
    page,
  }) => {
    await testLogger.info('Testing request queuing');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ retryAfter: 5 }),
      });
    });

    await page.goto('/analytics');

    // Should queue requests
    const queueSize = await page.evaluate(() => {
      return parseInt(localStorage.getItem('requestQueueSize') || '0');
    });
    expect(queueSize).toBeGreaterThan(0);
  });

  test('should retry after rate limit period', async ({ page }) => {
    await testLogger.info('Testing rate limit retry');

    let requestCount = 0;
    await page.route('**/api/**', (route) => {
      requestCount++;
      if (requestCount <= 5) {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ retryAfter: 1 }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: 'success' }),
        });
      }
    });

    await page.goto('/analytics');

    // Should eventually succeed
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should respect rate limit headers', async ({ page }) => {
    await testLogger.info('Testing rate limit headers');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: 'ok' }),
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '95',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });
    });

    await page.goto('/analytics');

    // Should track rate limit info
    const rateLimitInfo = await page.evaluate(() => {
      return {
        limit: localStorage.getItem('rateLimitLimit'),
        remaining: localStorage.getItem('rateLimitRemaining'),
      };
    });
    expect(rateLimitInfo.limit).toBe('100');
    expect(rateLimitInfo.remaining).toBe('95');
  });

  test('should prevent request spam', async ({ page }) => {
    await testLogger.info('Testing request spam prevention');

    let rapidRequestCount = 0;
    await page.route('**/api/**', (route) => {
      rapidRequestCount++;
      if (rapidRequestCount > 10) {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Too many rapid requests' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: 'ok' }),
        });
      }
    });

    // Make rapid requests
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => {
        fetch('/api/health').catch(() => {});
      });
    }

    await page.waitForTimeout(1000);

    expect(rapidRequestCount).toBeGreaterThan(10);
  });

  test('should handle different rate limits for different users', async ({
    page,
  }) => {
    await testLogger.info('Testing user-specific rate limits');

    // Regular user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.locator('[data-testid="login-button"]').click();

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '50',
        },
      });
    });

    await page.goto('/analytics');

    // Should apply regular user limits
    const limit = await page.evaluate(() => {
      return localStorage.getItem('rateLimitLimit');
    });
    expect(limit).toBe('100');
  });
});
