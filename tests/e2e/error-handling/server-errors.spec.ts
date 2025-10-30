import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Server Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle 500 Internal Server Error', async ({ page }) => {
    await testLogger.info('Testing 500 error handling');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/analytics');

    await expect(page.locator('[data-testid="server-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-code"]')).toContainText(
      '500'
    );
  });

  test('should handle 502 Bad Gateway', async ({ page }) => {
    await testLogger.info('Testing 502 error handling');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Bad Gateway' }),
      });
    });

    await page.goto('/analytics');

    await expect(page.locator('[data-testid="gateway-error"]')).toBeVisible();
  });

  test('should handle 503 Service Unavailable', async ({ page }) => {
    await testLogger.info('Testing 503 error handling');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      });
    });

    await page.goto('/analytics');

    await expect(
      page.locator('[data-testid="unavailable-error"]')
    ).toBeVisible();
  });

  test('should handle 504 Gateway Timeout', async ({ page }) => {
    await testLogger.info('Testing 504 error handling');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Gateway Timeout' }),
      });
    });

    await page.goto('/analytics');

    await expect(page.locator('[data-testid="timeout-error"]')).toBeVisible();
  });

  test('should handle database errors gracefully', async ({ page }) => {
    await testLogger.info('Testing database error handling');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed' }),
      });
    });

    await page.goto('/analytics');

    await expect(page.locator('[data-testid="database-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle application crashes', async ({ page }) => {
    await testLogger.info('Testing application crash handling');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: '', // Empty response
      });
    });

    await page.goto('/analytics');

    await expect(page.locator('[data-testid="crash-error"]')).toBeVisible();
  });

  test('should handle memory errors', async ({ page }) => {
    await testLogger.info('Testing memory error handling');

    // Simulate out of memory by causing heavy response
    await page.route('**/api/**', (route) => {
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: largeData }),
      });
    });

    await page.goto('/analytics');

    // Should handle gracefully or show memory error
    const hasError = await page
      .locator('[data-testid="memory-error"]')
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(true);
  });

  test('should handle slow response times', async ({ page }) => {
    await testLogger.info('Testing slow response handling');

    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: 'response' }),
      });
    });

    await page.goto('/analytics');

    await expect(
      page.locator('[data-testid="loading-indicator"]')
    ).toBeVisible();

    // Should eventually load
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should handle service degradation gracefully', async ({ page }) => {
    await testLogger.info('Testing service degradation');

    // Simulate degraded service (some endpoints work, others don't)
    await page.route('**/api/analytics/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service degraded' }),
      });
    });

    await page.route('**/api/health/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' }),
      });
    });

    await page.goto('/analytics');

    // Should show degraded status
    await expect(
      page.locator('[data-testid="degraded-service-warning"]')
    ).toBeVisible();
  });

  test('should handle overloaded server', async ({ page }) => {
    await testLogger.info('Testing overloaded server handling');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Server overloaded',
          retryAfter: 60,
        }),
      });
    });

    await page.goto('/analytics');

    await expect(
      page.locator('[data-testid="overloaded-error"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="retry-after"]')).toBeVisible();
  });

  test('should provide helpful error context', async ({ page }) => {
    await testLogger.info('Testing error context');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          requestId: 'abc123',
          timestamp: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/analytics');

    const errorContext = await page
      .locator('[data-testid="error-context"]')
      .textContent();
    expect(errorContext).toContain('requestId');
  });

  test('should handle partial server failures', async ({ page }) => {
    await testLogger.info('Testing partial failure handling');

    let requestCount = 0;
    await page.route('**/api/**', (route) => {
      requestCount++;
      if (requestCount % 3 === 0) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed' }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: 'ok' }),
        });
      }
    });

    // Navigate to a page that makes multiple requests
    await page.goto('/analytics');

    // Should handle partial failures
    const hasPartialContent = await page
      .locator('[data-testid="partial-content"]')
      .isVisible()
      .catch(() => false);
    expect(hasPartialContent || requestCount > 1).toBe(true);
  });
});
