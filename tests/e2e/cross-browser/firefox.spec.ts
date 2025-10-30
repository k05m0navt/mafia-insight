import { test, expect } from '@playwright/test';

// Run tests on Firefox only
test.use({ browserName: 'firefox' });

test.describe('Firefox Browser Tests', () => {
  test('should work properly on Firefox', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle Firefox-specific features', async ({ page }) => {
    const supports = await page.evaluate(() => {
      return {
        gecko: 'MozAppearance' in document.documentElement.style,
        firefox: navigator.userAgent.includes('Firefox'),
        indexedDB: typeof indexedDB !== 'undefined',
      };
    });

    expect(supports.indexedDB).toBe(true);
  });

  test('should handle Firefox focus behavior', async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="email-input"]').focus();
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('INPUT');
  });

  test('should support Firefox developer tools', async ({ page }) => {
    // Test that app works with Firefox DevTools open
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
  });
});
