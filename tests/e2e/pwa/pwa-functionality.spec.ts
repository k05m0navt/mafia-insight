import { test, expect } from '@playwright/test';

test.describe('PWA Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should display PWA install prompt', async ({ page }) => {
    // Check for install prompt
    await expect(
      page.locator('[data-testid="pwa-install-prompt"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="install-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="dismiss-button"]')).toBeVisible();

    // Check install prompt content
    await expect(page.locator('[data-testid="install-title"]')).toContainText(
      'Install Mafia Insight'
    );
    await expect(
      page.locator('[data-testid="install-description"]')
    ).toContainText('Add to home screen');
  });

  test('should install PWA successfully', async ({ page }) => {
    // Click install button
    await page.click('[data-testid="install-button"]');

    // Wait for installation confirmation
    await expect(page.locator('[data-testid="install-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="install-success"]')).toContainText(
      'Installed successfully'
    );

    // Check that install prompt is hidden
    await expect(
      page.locator('[data-testid="pwa-install-prompt"]')
    ).not.toBeVisible();
  });

  test('should dismiss PWA install prompt', async ({ page }) => {
    // Click dismiss button
    await page.click('[data-testid="dismiss-button"]');

    // Check that install prompt is hidden
    await expect(
      page.locator('[data-testid="pwa-install-prompt"]')
    ).not.toBeVisible();

    // Check that dismiss state is remembered
    await page.reload();
    await expect(
      page.locator('[data-testid="pwa-install-prompt"]')
    ).not.toBeVisible();
  });

  test('should work offline', async ({ page }) => {
    // Install PWA first
    await page.click('[data-testid="install-button"]');
    await expect(page.locator('[data-testid="install-success"]')).toBeVisible();

    // Go offline
    await page.context().setOffline(true);

    // Navigate to different pages
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.goto('/import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    // Check offline indicator
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toContainText('Offline');
  });

  test('should sync data when back online', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Make some changes while offline
    await page.goto('/import');
    await page.click('[data-testid="start-import-button"]');
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Check sync indicator
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-indicator"]')).toContainText(
      'Syncing'
    );

    // Wait for sync to complete
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-complete"]')).toContainText(
      'Synced'
    );
  });

  test('should cache resources for offline use', async ({ page }) => {
    // Check service worker registration
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });
    expect(swRegistration).toBeTruthy();

    // Check cached resources
    const cachedResources = await page.evaluate(() => {
      return caches.keys();
    });
    expect(cachedResources.length).toBeGreaterThan(0);

    // Go offline and verify cached resources work
    await page.context().setOffline(true);
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should display app manifest correctly', async ({ page }) => {
    // Check manifest link
    const manifestLink = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    expect(manifestLink).toBe('/manifest.json');

    // Check manifest content
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);

    const manifest = await manifestResponse.json();
    expect(manifest).toHaveProperty('name', 'Mafia Insight');
    expect(manifest).toHaveProperty('short_name', 'Mafia Insight');
    expect(manifest).toHaveProperty('start_url', '/');
    expect(manifest).toHaveProperty('display', 'standalone');
    expect(manifest).toHaveProperty('theme_color', '#000000');
    expect(manifest).toHaveProperty('background_color', '#ffffff');
    expect(manifest).toHaveProperty('icons');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should handle app updates', async ({ page }) => {
    // Check for update available
    await expect(
      page.locator('[data-testid="update-available"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="update-button"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="update-later-button"]')
    ).toBeVisible();

    // Click update button
    await page.click('[data-testid="update-button"]');

    // Check update progress
    await expect(page.locator('[data-testid="update-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="update-progress"]')).toContainText(
      'Updating'
    );

    // Wait for update complete
    await expect(page.locator('[data-testid="update-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="update-complete"]')).toContainText(
      'Updated'
    );
  });

  test('should handle push notifications', async ({ page }) => {
    // Request notification permission
    await page.click('[data-testid="enable-notifications-button"]');

    // Check permission request
    await expect(
      page.locator('[data-testid="notification-permission-request"]')
    ).toBeVisible();

    // Grant permission
    await page.click('[data-testid="grant-permission-button"]');

    // Check notification settings
    await expect(
      page.locator('[data-testid="notification-settings"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="notification-toggle"]')
    ).toBeChecked();

    // Test notification
    await page.click('[data-testid="test-notification-button"]');
    await expect(
      page.locator('[data-testid="notification-sent"]')
    ).toBeVisible();
  });

  test('should handle background sync', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Make changes that need sync
    await page.goto('/import');
    await page.click('[data-testid="start-import-button"]');
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Check background sync
    await expect(page.locator('[data-testid="background-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="background-sync"]')).toContainText(
      'Syncing in background'
    );
  });

  test('should handle app lifecycle events', async ({ page }) => {
    // Test app visibility change
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await expect(page.locator('[data-testid="app-hidden"]')).toBeVisible();

    // Test app focus
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await expect(page.locator('[data-testid="app-visible"]')).toBeVisible();
  });

  test('should handle storage quota', async ({ page }) => {
    // Check storage quota
    const quota = await page.evaluate(() => {
      return navigator.storage.estimate();
    });

    expect(quota).toHaveProperty('quota');
    expect(quota).toHaveProperty('usage');
    expect(quota.quota).toBeGreaterThan(0);

    // Check storage usage indicator
    await expect(page.locator('[data-testid="storage-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-usage"]')).toContainText(
      'Storage'
    );
  });

  test('should handle network status changes', async ({ page }) => {
    // Check online status
    await expect(page.locator('[data-testid="network-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-status"]')).toContainText(
      'Online'
    );

    // Go offline
    await page.context().setOffline(true);
    await expect(page.locator('[data-testid="network-status"]')).toContainText(
      'Offline'
    );

    // Go back online
    await page.context().setOffline(false);
    await expect(page.locator('[data-testid="network-status"]')).toContainText(
      'Online'
    );
  });

  test('should handle app shortcuts', async ({ page }) => {
    // Check app shortcuts
    await expect(page.locator('[data-testid="app-shortcuts"]')).toBeVisible();

    // Test shortcut navigation
    await page.click('[data-testid="shortcut-analytics"]');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.click('[data-testid="shortcut-import"]');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
  });

  test('should handle share target', async ({ page }) => {
    // Check share target registration
    const shareTarget = await page.evaluate(() => {
      return navigator.share;
    });
    expect(shareTarget).toBeTruthy();

    // Test share functionality
    await page.click('[data-testid="share-button"]');
    await expect(page.locator('[data-testid="share-dialog"]')).toBeVisible();

    // Test share data
    await page.fill('[data-testid="share-title"]', 'Mafia Insight Data');
    await page.fill(
      '[data-testid="share-text"]',
      'Check out this mafia game data'
    );
    await page.fill('[data-testid="share-url"]', 'https://mafia-insight.com');

    await page.click('[data-testid="share-confirm"]');
    await expect(page.locator('[data-testid="share-success"]')).toBeVisible();
  });

  test('should handle file handling', async ({ page }) => {
    // Check file handling registration
    await expect(page.locator('[data-testid="file-handler"]')).toBeVisible();

    // Test file upload
    await page.setInputFiles('[data-testid="file-input"]', 'test-data.json');
    await expect(page.locator('[data-testid="file-uploaded"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-uploaded"]')).toContainText(
      'test-data.json'
    );
  });

  test('should handle protocol handling', async ({ page }) => {
    // Check protocol handler registration
    await expect(
      page.locator('[data-testid="protocol-handler"]')
    ).toBeVisible();

    // Test protocol handling
    await page.goto('mafia-insight://analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.goto('mafia-insight://import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
  });

  test('should handle theme changes', async ({ page }) => {
    // Check theme support
    await expect(page.locator('[data-testid="theme-selector"]')).toBeVisible();

    // Test light theme
    await page.click('[data-testid="theme-light"]');
    await expect(page.locator('[data-testid="app-root"]')).toHaveClass(
      /light-theme/
    );

    // Test dark theme
    await page.click('[data-testid="theme-dark"]');
    await expect(page.locator('[data-testid="app-root"]')).toHaveClass(
      /dark-theme/
    );
  });

  test('should handle orientation changes', async ({ page }) => {
    // Test portrait orientation
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    // Test landscape orientation
    await page.setViewportSize({ width: 667, height: 375 });
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

    // Check responsive layout
    await expect(
      page.locator('[data-testid="responsive-layout"]')
    ).toBeVisible();
  });

  test('should handle touch gestures', async ({ page }) => {
    // Test swipe gestures
    await page.touchscreen.tap(100, 100);
    await expect(page.locator('[data-testid="touch-feedback"]')).toBeVisible();

    // Test pinch zoom
    await page.touchscreen.tap(200, 200);
    await expect(page.locator('[data-testid="zoom-indicator"]')).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test keyboard shortcuts
    await page.keyboard.press('Control+KeyA');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.keyboard.press('Control+KeyI');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    await page.keyboard.press('Control+KeyS');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
  });

  test('should handle accessibility features', async ({ page }) => {
    // Check accessibility features
    await expect(
      page.locator('[data-testid="accessibility-menu"]')
    ).toBeVisible();

    // Test high contrast mode
    await page.click('[data-testid="high-contrast-toggle"]');
    await expect(page.locator('[data-testid="app-root"]')).toHaveClass(
      /high-contrast/
    );

    // Test reduced motion
    await page.click('[data-testid="reduced-motion-toggle"]');
    await expect(page.locator('[data-testid="app-root"]')).toHaveClass(
      /reduced-motion/
    );

    // Test screen reader support
    await expect(
      page.locator('[data-testid="screen-reader-content"]')
    ).toBeVisible();
  });

  test('should handle performance monitoring', async ({ page }) => {
    // Check performance metrics
    await expect(
      page.locator('[data-testid="performance-metrics"]')
    ).toBeVisible();

    // Check Core Web Vitals
    await expect(page.locator('[data-testid="lcp-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="fid-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="cls-metric"]')).toBeVisible();

    // Check performance score
    await expect(
      page.locator('[data-testid="performance-score"]')
    ).toBeVisible();
    const score = await page
      .locator('[data-testid="performance-score"]')
      .textContent();
    expect(parseInt(score || '0')).toBeGreaterThan(80);
  });
});
