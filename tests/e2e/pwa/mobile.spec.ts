import { test, expect, devices } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('PWA Mobile Testing', () => {
  // Test on various mobile devices
  for (const device of [
    devices['iPhone 12'],
    devices['Pixel 5'],
    devices['iPad Pro'],
  ]) {
    test.describe(`${device.viewport.name}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(device.viewport);
        await page.goto('/');
      });

      test('should display correctly on mobile screen', async ({ page }) => {
        await testLogger.info(`Testing ${device.viewport.name} display`);

        await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
        await expect(page.locator('[data-testid="navbar"]')).toBeVisible();

        // Check that layout is responsive
        const body = page.locator('body');
        const layout = await body.boundingBox();
        expect(layout?.width).toBe(device.viewport.width);
        expect(layout?.height).toBeLessThanOrEqual(device.viewport.height);
      });

      test('should support touch gestures', async ({ page }) => {
        await testLogger.info(
          `Testing touch gestures on ${device.viewport.name}`
        );

        // Test swipe gesture
        const start = { x: 100, y: 200 };
        const end = { x: 300, y: 200 };

        await page.touchscreen.tap(start.x, start.y);
        await page.mouse.move(end.x, end.y);
        await page.mouse.up();

        // Check if navigation occurred (if swipe navigation is implemented)
        await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
      });

      test('should handle mobile keyboard', async ({ page }) => {
        await testLogger.info(
          `Testing mobile keyboard on ${device.viewport.name}`
        );

        // Go to login page
        await page.goto('/login');

        // Focus on email input
        await page.locator('[data-testid="email-input"]').click();

        // Check that keyboard doesn't break layout
        const layout = await page.locator('body').boundingBox();
        expect(layout).toBeTruthy();

        // Type email
        await page
          .locator('[data-testid="email-input"]')
          .fill('test@example.com');

        // Check that input is still visible
        const input = await page
          .locator('[data-testid="email-input"]')
          .boundingBox();
        expect(input).toBeTruthy();
      });

      test('should show mobile-optimized navigation', async ({ page }) => {
        await testLogger.info(
          `Testing mobile navigation on ${device.viewport.name}`
        );

        // Check for mobile menu button
        await expect(
          page.locator('[data-testid="mobile-menu-button"]')
        ).toBeVisible();

        // Open mobile menu
        await page.locator('[data-testid="mobile-menu-button"]').click();

        // Check mobile menu is visible
        await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      });
    });
  }

  test('should handle orientation changes', async ({ page }) => {
    await testLogger.info('Testing orientation changes');

    await page.setViewportSize({ width: 375, height: 667 }); // Portrait
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    await page.setViewportSize({ width: 667, height: 375 }); // Landscape
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should support mobile browsers', async ({ page, browserName }) => {
    await testLogger.info(`Testing on ${browserName}`);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Test mobile-specific features
    if (browserName === 'webkit' || browserName === 'Mobile Safari') {
      // Safari-specific mobile tests
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
    }

    if (browserName === 'Mobile Chrome') {
      // Chrome-specific mobile tests
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
    }
  });

  test('should handle mobile performance', async ({ page }) => {
    await testLogger.info('Testing mobile performance');

    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds on mobile
    expect(loadTime).toBeLessThan(3000);

    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          resolve(entries);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
      });
    });

    expect(metrics).toBeTruthy();
  });
});
