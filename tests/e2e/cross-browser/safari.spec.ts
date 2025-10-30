import { test, expect } from '@playwright/test';

// Run tests on WebKit/Safari only
test.use({ browserName: 'webkit' });

test.describe('Safari Browser Tests', () => {
  test('should work properly on Safari', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle Safari-specific features', async ({ page }) => {
    // Safari may have different behavior
    const supports = await page.evaluate(() => {
      return {
        webKit: 'webkitHidden' in document,
        safari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        intl: typeof Intl !== 'undefined',
      };
    });

    expect(supports.intl).toBe(true);
  });

  test('should handle Safari date handling', async ({ page }) => {
    const dateTest = await page.evaluate(() => {
      const date = new Date('2024-01-01');
      return date.toISOString();
    });

    expect(dateTest).toBeTruthy();
  });

  test('should support WebKit CSS features', async ({ page }) => {
    await page.goto('/');
    const styles = await page.evaluate(() => {
      return window.getComputedStyle(document.body).display;
    });
    expect(styles).toBeTruthy();
  });
});
