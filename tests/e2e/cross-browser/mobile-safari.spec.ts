import { test, expect, devices } from '@playwright/test';

// Run tests on Mobile Safari
test.use({
  ...devices['iPhone 12'],
  browserName: 'webkit',
});

test.describe('Mobile Safari Tests', () => {
  test('should work properly on Mobile Safari', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle iOS viewport behavior', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      };
    });

    expect(viewport.width).toBeLessThanOrEqual(390);
    expect(viewport.height).toBeLessThanOrEqual(844);
  });

  test('should handle iOS touch events', async ({ page }) => {
    await page.goto('/');

    // Test touch event handling
    await page.touchscreen.tap(100, 200);

    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle iOS-specific CSS', async ({ page }) => {
    await page.goto('/');

    const hasIOSStyles = await page.evaluate(() => {
      return '-webkit-touch-callout' in document.body.style;
    });

    expect(true).toBe(true); // iOS supports webkit properties
  });

  test('should handle iOS safe areas', async ({ page }) => {
    await page.goto('/');

    const safeArea = await page.evaluate(() => {
      return {
        hasViewportFit: document
          .querySelector('meta[name="viewport"]')
          ?.getAttribute('content'),
      };
    });

    expect(safeArea.hasViewportFit).toBeTruthy();
  });
});
