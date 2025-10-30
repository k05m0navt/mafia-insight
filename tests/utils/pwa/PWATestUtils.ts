import { Page, expect } from '@playwright/test';

export class PWATestUtils {
  static async navigateToPWA(page: Page) {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  }

  static async installPWA(page: Page) {
    // Check for install prompt
    await expect(
      page.locator('[data-testid="pwa-install-prompt"]')
    ).toBeVisible();

    // Click install button
    await page.click('[data-testid="install-button"]');

    // Wait for installation confirmation
    await expect(page.locator('[data-testid="install-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="install-success"]')).toContainText(
      'Installed successfully'
    );
  }

  static async dismissInstallPrompt(page: Page) {
    // Click dismiss button
    await page.click('[data-testid="dismiss-button"]');

    // Check that install prompt is hidden
    await expect(
      page.locator('[data-testid="pwa-install-prompt"]')
    ).not.toBeVisible();
  }

  static async goOffline(page: Page) {
    await page.context().setOffline(true);
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toContainText('Offline');
  }

  static async goOnline(page: Page) {
    await page.context().setOffline(false);
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).not.toBeVisible();
  }

  static async verifyOfflineFunctionality(page: Page) {
    // Navigate to different pages while offline
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.goto('/import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
  }

  static async verifyDataSync(page: Page) {
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
  }

  static async verifyServiceWorkerRegistration(page: Page) {
    // Check service worker registration
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });
    expect(swRegistration).toBeTruthy();
  }

  static async verifyCachedResources(page: Page) {
    // Check cache storage
    const cacheNames = await page.evaluate(() => {
      return caches.keys();
    });
    expect(cacheNames.length).toBeGreaterThan(0);

    // Check cached resources indicator
    await expect(
      page.locator('[data-testid="cached-resources"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="cache-status"]')).toContainText(
      'Cached'
    );
  }

  static async verifyManifest(page: Page) {
    // Check manifest link
    const manifestLink = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    expect(manifestLink).toBe('/manifest.json');

    // Check manifest content
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.status()).toBe(200);

    const manifest = await manifestResponse.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
    expect(manifest).toHaveProperty('theme_color');
    expect(manifest).toHaveProperty('background_color');
    expect(manifest).toHaveProperty('icons');
  }

  static async verifyAppUpdate(page: Page) {
    // Check for update available
    await expect(
      page.locator('[data-testid="update-available"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="update-button"]')).toBeVisible();

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
  }

  static async enableNotifications(page: Page) {
    // Click enable notifications button
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
  }

  static async testNotification(page: Page) {
    // Test notification
    await page.click('[data-testid="test-notification-button"]');
    await expect(
      page.locator('[data-testid="notification-sent"]')
    ).toBeVisible();
  }

  static async verifyBackgroundSync(page: Page) {
    // Check background sync
    await expect(page.locator('[data-testid="background-sync"]')).toBeVisible();
    await expect(page.locator('[data-testid="background-sync"]')).toContainText(
      'Syncing in background'
    );
  }

  static async verifyAppLifecycle(page: Page) {
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
  }

  static async verifyStorageQuota(page: Page) {
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
  }

  static async verifyNetworkStatus(page: Page) {
    // Check online status
    await expect(page.locator('[data-testid="network-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-status"]')).toContainText(
      'Online'
    );
  }

  static async testAppShortcuts(page: Page) {
    // Check app shortcuts
    await expect(page.locator('[data-testid="app-shortcuts"]')).toBeVisible();

    // Test shortcut navigation
    await page.click('[data-testid="shortcut-analytics"]');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.click('[data-testid="shortcut-import"]');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
  }

  static async testShareTarget(page: Page) {
    // Check share target registration
    await expect(page.locator('[data-testid="file-handler"]')).toBeVisible();

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
  }

  static async testFileHandling(page: Page) {
    // Check file handling registration
    await expect(page.locator('[data-testid="file-handler"]')).toBeVisible();

    // Test file upload
    await page.setInputFiles(
      '[data-testid="file-upload-input"]',
      'test-data.json'
    );
    await expect(page.locator('[data-testid="file-uploaded"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-uploaded"]')).toContainText(
      'test-data.json'
    );
  }

  static async testProtocolHandling(page: Page) {
    // Check protocol handler registration
    await expect(
      page.locator('[data-testid="protocol-handler"]')
    ).toBeVisible();

    // Test protocol handling
    await page.goto('mafia-insight://analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.goto('mafia-insight://import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
  }

  static async testThemeChanges(page: Page) {
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

    // Test system theme
    await page.click('[data-testid="theme-system"]');
    await expect(page.locator('[data-testid="app-root"]')).toHaveClass(
      /system-theme/
    );
  }

  static async testOrientationChanges(page: Page) {
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
  }

  static async testTouchGestures(page: Page) {
    // Test swipe gestures
    await page.touchscreen.tap(100, 100);
    await expect(page.locator('[data-testid="touch-feedback"]')).toBeVisible();

    // Test pinch zoom
    await page.touchscreen.tap(200, 200);
    await expect(page.locator('[data-testid="zoom-indicator"]')).toBeVisible();
  }

  static async testKeyboardShortcuts(page: Page) {
    // Test keyboard shortcuts
    await page.keyboard.press('Control+KeyA');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.keyboard.press('Control+KeyI');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    await page.keyboard.press('Control+KeyS');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
  }

  static async testAccessibilityFeatures(page: Page) {
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
  }

  static async verifyPerformanceMetrics(page: Page) {
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
    expect(parseInt(score?.replace('ms', '') || '0')).toBeGreaterThan(80);
  }

  static async verifyOfflineDataStorage(page: Page) {
    // Check offline data storage
    await expect(
      page.locator('[data-testid="offline-data-stored"]')
    ).toBeVisible();

    // Check offline storage
    const offlineData = await page.evaluate(() => {
      return localStorage.getItem('offline-data');
    });
    expect(offlineData).toBeTruthy();
  }

  static async verifyOfflineErrorHandling(page: Page) {
    // Check offline error handling
    await expect(page.locator('[data-testid="offline-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-error"]')).toContainText(
      'Offline'
    );

    // Check retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  }

  static async verifyOfflineFormSubmissions(page: Page) {
    // Fill out a form while offline
    await page.fill('[data-testid="import-name"]', 'Test Import');
    await page.selectOption('[data-testid="import-source"]', 'gomafia');
    await page.click('[data-testid="start-import-button"]');

    // Check that form is queued for later submission
    await expect(page.locator('[data-testid="form-queued"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-queued"]')).toContainText(
      'Queued for later'
    );
  }

  static async verifyOfflineSearch(page: Page) {
    // Test search functionality while offline
    await page.fill('[data-testid="search-input"]', 'player');
    await page.click('[data-testid="search-button"]');

    // Check that search works with cached data
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-results"]')).toContainText(
      'player'
    );
  }

  static async verifyOfflineFiltering(page: Page) {
    // Test filtering while offline
    await page.selectOption('[data-testid="filter-rating"]', '1500-2000');
    await expect(
      page.locator('[data-testid="filtered-results"]')
    ).toBeVisible();

    // Test sorting while offline
    await page.selectOption('[data-testid="sort-by"]', 'rating');
    await page.selectOption('[data-testid="sort-order"]', 'desc');
    await expect(page.locator('[data-testid="sorted-results"]')).toBeVisible();
  }

  static async verifyOfflineDataExport(page: Page) {
    // Test data export while offline
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-queued"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-queued"]')).toContainText(
      'Queued for export'
    );
  }

  static async verifyOfflineNotifications(page: Page) {
    // Test offline notifications
    await page.click('[data-testid="start-import-button"]');
    await expect(
      page.locator('[data-testid="offline-notification"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-notification"]')
    ).toContainText('Offline mode');
  }

  static async verifyOfflineDataSyncConflicts(page: Page) {
    // Check for sync conflicts
    await expect(page.locator('[data-testid="sync-conflict"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-conflict"]')).toContainText(
      'Conflict detected'
    );

    // Resolve conflict
    await page.click('[data-testid="resolve-conflict-button"]');
    await expect(
      page.locator('[data-testid="conflict-resolved"]')
    ).toBeVisible();
  }

  static async verifyOfflineDataCleanup(page: Page) {
    // Test data cleanup
    await page.click('[data-testid="cleanup-offline-data"]');
    await expect(
      page.locator('[data-testid="offline-data-cleaned"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-data-cleaned"]')
    ).toContainText('Cleaned');
  }

  static async verifyOfflinePerformanceMonitoring(page: Page) {
    // Check offline performance metrics
    await expect(
      page.locator('[data-testid="offline-performance"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-performance"]')
    ).toContainText('Performance');

    // Check offline resource usage
    await expect(
      page.locator('[data-testid="offline-resource-usage"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-resource-usage"]')
    ).toContainText('Resource usage');
  }

  static async verifyOfflineAccessibility(page: Page) {
    // Check offline accessibility features
    await expect(
      page.locator('[data-testid="offline-accessibility"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-accessibility"]')
    ).toContainText('Accessibility');

    // Test keyboard navigation while offline
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  }

  static async verifyOfflineErrorRecovery(page: Page) {
    // Test error recovery
    await page.click('[data-testid="recover-error-button"]');
    await expect(page.locator('[data-testid="error-recovered"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-recovered"]')).toContainText(
      'Recovered'
    );
  }

  static async verifyOfflineDataIntegrity(page: Page) {
    // Check data integrity
    await expect(page.locator('[data-testid="data-integrity"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-integrity"]')).toContainText(
      'Integrity check'
    );

    // Test data validation
    await page.click('[data-testid="validate-data-button"]');
    await expect(page.locator('[data-testid="data-validated"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-validated"]')).toContainText(
      'Valid'
    );
  }

  static async verifyOfflineUserPreferences(page: Page) {
    // Test user preferences while offline
    await page.click('[data-testid="theme-toggle"]');
    await expect(
      page.locator('[data-testid="preference-saved"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="preference-saved"]')
    ).toContainText('Saved offline');
  }
}
