import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('PWA Offline Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should work completely offline', async ({ page }) => {
    await testLogger.info('Testing complete offline functionality');

    // Go offline
    await page.context().setOffline(true);

    // Check offline indicator
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toContainText('Offline');

    // Navigate to analytics
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    // Navigate to import
    await page.goto('/import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
  });

  test('should show offline message', async ({ page }) => {
    await testLogger.info('Testing offline message display');

    await page.context().setOffline(true);

    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="offline-message"]')).toContainText(
      'You are currently offline'
    );
  });

  test('should cache resources for offline use', async ({ page }) => {
    await testLogger.info('Testing resource caching');

    // Check service worker registration
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });
    expect(swRegistration).toBeTruthy();

    // Check cache storage
    const cacheNames = await page.evaluate(() => {
      return caches.keys();
    });
    expect(cacheNames.length).toBeGreaterThan(0);
  });

  test('should handle offline to online transition', async ({ page }) => {
    await testLogger.info('Testing offline to online transition');

    // Go offline
    await page.context().setOffline(true);
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Offline indicator should disappear
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).not.toBeVisible();
  });

  test('should handle online to offline transition', async ({ page }) => {
    await testLogger.info('Testing online to offline transition');

    // Start online
    await page.context().setOffline(false);

    // Go offline
    await page.context().setOffline(true);

    // Offline indicator should appear
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();
  });

  test('should store offline actions for sync', async ({ page }) => {
    await testLogger.info('Testing offline action storage');

    await page.context().setOffline(true);

    // Perform an action while offline
    await page.goto('/analytics');
    await page.locator('[data-testid="filter-button"]').click();

    // Check that action is queued
    const pendingActions = await page.evaluate(() => {
      return localStorage.getItem('offlineQueue');
    });
    expect(pendingActions).toBeTruthy();
  });

  test('should sync offline actions when back online', async ({ page }) => {
    await testLogger.info('Testing offline action sync');

    // Store offline action
    await page.context().setOffline(true);
    await page.goto('/analytics');
    await page.locator('[data-testid="filter-button"]').click();

    // Go back online
    await page.context().setOffline(false);

    // Check that sync indicator appears
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
  });

  test('should show cached data when offline', async ({ page }) => {
    await testLogger.info('Testing cached data display');

    // Load data while online
    await page.goto('/analytics/players');
    await expect(page.locator('[data-testid="players-list"]')).toBeVisible();

    // Go offline
    await page.context().setOffline(true);

    // Refresh page
    await page.reload();

    // Should still show cached data
    await expect(page.locator('[data-testid="players-list"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="cached-data-indicator"]')
    ).toBeVisible();
  });

  test('should handle service worker updates', async ({ page }) => {
    await testLogger.info('Testing service worker updates');

    // Check service worker is installed
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });
    expect(swRegistration).toBeTruthy();

    // Trigger update check
    await page.evaluate(() => {
      return navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.update());
    });

    // Check that app is still functional
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle intermittent connectivity', async ({ page }) => {
    await testLogger.info('Testing intermittent connectivity');

    // Toggle offline state multiple times
    for (let i = 0; i < 5; i++) {
      await page.context().setOffline(true);
      await page.waitForTimeout(500);

      await page.context().setOffline(false);
      await page.waitForTimeout(500);
    }

    // App should still be functional
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });
});
