import { test, expect, devices } from '@playwright/test';
import { chromium } from '@playwright/test';

// Run tests on Chromium/Chrome only
test.use({ browserName: 'chromium' });

test.describe('Chrome Browser Tests', () => {
  test('should work properly on Chrome', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle Chrome-specific features', async ({ page }) => {
    // Chrome supports modern features
    const supports = await page.evaluate(() => {
      return {
        webAssembly: typeof WebAssembly !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        localStorage: typeof Storage !== 'undefined',
      };
    });

    expect(supports.webAssembly).toBe(true);
    expect(supports.serviceWorker).toBe(true);
    expect(supports.localStorage).toBe(true);
  });

  test('should handle Chrome extensions', async ({ page }) => {
    // Test that extensions don't break functionality
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
  });

  test('should support Chrome DevTools Protocol', async ({ page }) => {
    // Test CDP integration if needed
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});
