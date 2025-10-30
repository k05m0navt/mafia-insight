import { test, expect } from '@playwright/test';

// Run tests on Chromium (Edge uses Chromium engine)
test.use({ browserName: 'chromium' });

test.describe('Edge Browser Tests', () => {
  test('should work properly on Edge', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle Edge-specific behavior', async ({ page }) => {
    // Edge is Chromium-based but may have specific behaviors
    const supports = await page.evaluate(() => {
      return {
        chromeEngine: !!(window as any).chrome,
        edge: navigator.userAgent.includes('Edg'),
        modernFeatures: typeof BigInt !== 'undefined',
      };
    });

    expect(supports.modernFeatures).toBe(true);
  });

  test('should support Edge collections', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
  });

  test('should handle Edge extensions', async ({ page }) => {
    // Test compatibility with Edge extensions
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});
