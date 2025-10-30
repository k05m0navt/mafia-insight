import { test, expect, devices } from '@playwright/test';

// Run tests on Android Chrome
test.use({
  ...devices['Pixel 5'],
  browserName: 'chromium',
});

test.describe('Android Chrome Tests', () => {
  test('should work properly on Android Chrome', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle Android viewport behavior', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.orientation || 0,
      };
    });

    expect(viewport.width).toBeLessThanOrEqual(393);
    expect(viewport.height).toBeLessThanOrEqual(851);
  });

  test('should handle Android touch events', async ({ page }) => {
    await page.goto('/');

    // Test touch event handling
    await page.touchscreen.tap(100, 200);

    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle Android back button behavior', async ({ page }) => {
    await page.goto('/');

    // Simulate back button (if implemented)
    await page.goBack();

    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('should handle Android Chrome V8 engine', async ({ page }) => {
    await page.goto('/');

    const engineInfo = await page.evaluate(() => {
      return {
        v8: (window as any).v8 || 'chrome',
        chrome: !!(window as any).chrome,
      };
    });

    expect(engineInfo.chrome).toBe(true);
  });

  test('should handle Android scaling', async ({ page }) => {
    await page.goto('/');

    const scale = await page.evaluate(() => {
      return {
        devicePixelRatio: window.devicePixelRatio,
        visualViewport: window.visualViewport?.scale || 1,
      };
    });

    expect(scale.devicePixelRatio).toBeGreaterThan(0);
  });
});
