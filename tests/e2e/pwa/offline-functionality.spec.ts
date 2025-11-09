import { test, expect } from '@playwright/test';

test.describe('PWA Offline Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should work completely offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Check offline indicator
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toContainText('Offline');

    // Navigate to different pages
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.goto('/admin/import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
  });

  test('should cache critical resources', async ({ page }) => {
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

    // Go offline and verify cached resources
    await page.context().setOffline(true);

    // Check that critical resources are cached
    await expect(
      page.locator('[data-testid="cached-resources"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="cache-status"]')).toContainText(
      'Cached'
    );
  });

  test('should handle offline data storage', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Create some data while offline
    await page.goto('/admin/import');
    await page.click('[data-testid="start-import-button"]');
    await expect(
      page.locator('[data-testid="offline-data-stored"]')
    ).toBeVisible();

    // Check offline storage
    const offlineData = await page.evaluate(() => {
      return localStorage.getItem('offline-data');
    });
    expect(offlineData).toBeTruthy();

    // Check IndexedDB
    const indexedDBData = await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('mafia-insight-offline');
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['imports'], 'readonly');
          const store = transaction.objectStore('imports');
          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => resolve(getAllRequest.result);
        };
      });
    });
    expect(indexedDBData).toBeTruthy();
  });

  test('should sync data when back online', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Make changes while offline
    await page.goto('/admin/import');
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

  test('should handle offline error states', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Try to access network-dependent features
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="offline-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-error"]')).toContainText(
      'Offline'
    );

    // Check retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Go back online and retry
    await page.context().setOffline(false);
    await page.click('[data-testid="retry-button"]');
    await expect(
      page.locator('[data-testid="offline-error"]')
    ).not.toBeVisible();
  });

  test('should handle offline navigation', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Test navigation between pages
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    await page.goto('/admin/import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

    // Test back navigation
    await page.goBack();
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    await page.goBack();
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
  });

  test('should handle offline form submissions', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Fill out a form
    await page.goto('/admin/import');
    await page.fill('[data-testid="import-name"]', 'Test Import');
    await page.selectOption('[data-testid="import-source"]', 'gomafia');
    await page.click('[data-testid="start-import-button"]');

    // Check that form is queued for later submission
    await expect(page.locator('[data-testid="form-queued"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-queued"]')).toContainText(
      'Queued for later'
    );

    // Go back online
    await page.context().setOffline(false);

    // Check that form is submitted
    await expect(page.locator('[data-testid="form-submitted"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-submitted"]')).toContainText(
      'Submitted'
    );
  });

  test('should handle offline data validation', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Try to submit invalid data
    await page.goto('/admin/import');
    await page.fill('[data-testid="import-name"]', '');
    await page.click('[data-testid="start-import-button"]');

    // Check validation error
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Required');

    // Fix validation error
    await page.fill('[data-testid="import-name"]', 'Valid Import');
    await page.click('[data-testid="start-import-button"]');

    // Check that form is queued
    await expect(page.locator('[data-testid="form-queued"]')).toBeVisible();
  });

  test('should handle offline search functionality', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Test search functionality
    await page.goto('/analytics');
    await page.fill('[data-testid="search-input"]', 'player');
    await page.click('[data-testid="search-button"]');

    // Check that search works with cached data
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-results"]')).toContainText(
      'player'
    );
  });

  test('should handle offline filtering and sorting', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Test filtering
    await page.goto('/analytics');
    await page.selectOption('[data-testid="filter-rating"]', '1500-2000');
    await expect(
      page.locator('[data-testid="filtered-results"]')
    ).toBeVisible();

    // Test sorting
    await page.selectOption('[data-testid="sort-by"]', 'rating');
    await page.selectOption('[data-testid="sort-order"]', 'desc');
    await expect(page.locator('[data-testid="sorted-results"]')).toBeVisible();
  });

  test('should handle offline data export', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Test data export
    await page.goto('/analytics');
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-queued"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-queued"]')).toContainText(
      'Queued for export'
    );

    // Go back online
    await page.context().setOffline(false);

    // Check that export is processed
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-complete"]')).toContainText(
      'Exported'
    );
  });

  test('should handle offline notifications', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Test offline notifications
    await page.goto('/admin/import');
    await page.click('[data-testid="start-import-button"]');
    await expect(
      page.locator('[data-testid="offline-notification"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-notification"]')
    ).toContainText('Offline mode');
  });

  test('should handle offline data synchronization conflicts', async ({
    page,
  }) => {
    // Go offline
    await page.context().setOffline(true);

    // Make changes while offline
    await page.goto('/admin/import');
    await page.click('[data-testid="start-import-button"]');
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

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
  });

  test('should handle offline data cleanup', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Create some offline data
    await page.goto('/admin/import');
    await page.click('[data-testid="start-import-button"]');
    await expect(
      page.locator('[data-testid="offline-data-stored"]')
    ).toBeVisible();

    // Test data cleanup
    await page.click('[data-testid="cleanup-offline-data"]');
    await expect(
      page.locator('[data-testid="offline-data-cleaned"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="offline-data-cleaned"]')
    ).toContainText('Cleaned');
  });

  test('should handle offline performance monitoring', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

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
  });

  test('should handle offline accessibility', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

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
  });

  test('should handle offline error recovery', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Simulate an error
    await page.goto('/error-page');
    await expect(page.locator('[data-testid="offline-error"]')).toBeVisible();

    // Test error recovery
    await page.click('[data-testid="recover-error-button"]');
    await expect(page.locator('[data-testid="error-recovered"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-recovered"]')).toContainText(
      'Recovered'
    );
  });

  test('should handle offline data integrity', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Check data integrity
    await expect(page.locator('[data-testid="data-integrity"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-integrity"]')).toContainText(
      'Integrity check'
    );

    // Test data validation
    await page.goto('/admin/import');
    await page.click('[data-testid="validate-data-button"]');
    await expect(page.locator('[data-testid="data-validated"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-validated"]')).toContainText(
      'Valid'
    );
  });

  test('should handle offline user preferences', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Test user preferences
    await page.goto('/settings');
    await page.click('[data-testid="theme-toggle"]');
    await expect(
      page.locator('[data-testid="preference-saved"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="preference-saved"]')
    ).toContainText('Saved offline');

    // Go back online
    await page.context().setOffline(false);

    // Check that preferences are synced
    await expect(
      page.locator('[data-testid="preference-synced"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="preference-synced"]')
    ).toContainText('Synced');
  });
});
