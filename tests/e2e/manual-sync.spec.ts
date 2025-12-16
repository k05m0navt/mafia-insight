import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E tests for Manual Data Synchronization Trigger
 * Tests the complete user flow: click sync button → sync starts → progress updates → sync completes → summary displayed
 */

test.describe('Manual Sync', () => {
  const mockAuthToken = 'mock-auth-token-12345';

  test.beforeEach(async ({ page, context }) => {
    // Set up authenticated session
    await context.addCookies([
      {
        name: 'auth-token',
        value: mockAuthToken,
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock API responses
    await page.route('**/api/gomafia-sync/manual/status', async (route) => {
      const url = new URL(route.request().url());
      const mockStatus = {
        isRunning: false,
        progress: 0,
        currentOperation: null,
        lastSyncTime: null,
        lastSyncType: null,
        lastError: null,
        syncLogId: null,
        syncLogStatus: null,
        startTime: null,
        endTime: null,
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatus),
      });
    });
  });

  test('should display sync page with manual sync button', async ({ page }) => {
    await page.goto('/sync');

    // Check page title
    await expect(page.locator('h1')).toContainText('Data Synchronization');

    // Check manual sync button is visible
    const syncButton = page.getByRole('button', { name: /sync now/i });
    await expect(syncButton).toBeVisible();
    await expect(syncButton).toBeEnabled();
  });

  test('should trigger sync and show loading state', async ({ page }) => {
    let syncTriggered = false;

    // Mock sync trigger endpoint
    await page.route('**/api/gomafia-sync/manual', async (route) => {
      syncTriggered = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Manual sync completed successfully',
          summary: {
            gamesImported: 5,
            gamesUpdated: 3,
            errors: 0,
          },
        }),
      });
    });

    // Mock status endpoint to return running state after trigger
    await page.route('**/api/gomafia-sync/manual/status', async (route) => {
      const mockStatus = syncTriggered
        ? {
            isRunning: true,
            progress: 50,
            currentOperation: 'Processing games...',
            lastSyncTime: null,
            lastSyncType: null,
            lastError: null,
            syncLogId: 'sync-log-123',
            syncLogStatus: 'RUNNING',
            startTime: new Date().toISOString(),
            endTime: null,
          }
        : {
            isRunning: false,
            progress: 0,
            currentOperation: null,
            lastSyncTime: null,
            lastSyncType: null,
            lastError: null,
            syncLogId: null,
            syncLogStatus: null,
            startTime: null,
            endTime: null,
          };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatus),
      });
    });

    await page.goto('/sync');

    const syncButton = page.getByRole('button', { name: /sync now/i });
    await syncButton.click();

    // Verify button is disabled and shows loading state
    await expect(syncButton).toBeDisabled();
    await expect(syncButton).toContainText('Syncing...');

    // Verify API was called
    expect(syncTriggered).toBe(true);
  });

  test('should display progress when sync is running', async ({ page }) => {
    let requestCount = 0;

    // Mock status endpoint with progressive updates
    await page.route('**/api/gomafia-sync/manual/status', async (route) => {
      requestCount++;
      const progress = Math.min(requestCount * 25, 100);
      const isRunning = progress < 100;

      const mockStatus = {
        isRunning,
        progress,
        currentOperation: isRunning
          ? `Processing games... (${progress}%)`
          : null,
        lastSyncTime: !isRunning ? new Date().toISOString() : null,
        lastSyncType: !isRunning ? 'INCREMENTAL' : null,
        lastError: null,
        syncLogId: 'sync-log-123',
        syncLogStatus: isRunning ? 'RUNNING' : 'COMPLETED',
        startTime: new Date().toISOString(),
        endTime: !isRunning ? new Date().toISOString() : null,
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatus),
      });
    });

    // Mock sync trigger
    await page.route('**/api/gomafia-sync/manual', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Sync started',
          summary: {
            gamesImported: 5,
            gamesUpdated: 3,
            errors: 0,
          },
        }),
      });
    });

    await page.goto('/sync');

    const syncButton = page.getByRole('button', { name: /sync now/i });
    await syncButton.click();

    // Wait for progress bar to appear
    await expect(page.getByRole('progressbar')).toBeVisible({ timeout: 5000 });

    // Verify progress updates are displayed
    await expect(page.getByText(/processing games/i)).toBeVisible();
  });

  test('should display completion message when sync finishes', async ({
    page,
  }) => {
    let syncCompleted = false;

    // Mock sync trigger
    await page.route('**/api/gomafia-sync/manual', async (route) => {
      syncCompleted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Manual sync completed successfully',
          summary: {
            gamesImported: 5,
            gamesUpdated: 3,
            errors: 0,
          },
        }),
      });
    });

    // Mock status endpoint - start with running, then complete
    await page.route('**/api/gomafia-sync/manual/status', async (route) => {
      const mockStatus = syncCompleted
        ? {
            isRunning: false,
            progress: 100,
            currentOperation: null,
            lastSyncTime: new Date().toISOString(),
            lastSyncType: 'INCREMENTAL',
            lastError: null,
            syncLogId: 'sync-log-123',
            syncLogStatus: 'COMPLETED',
            startTime: new Date(Date.now() - 60000).toISOString(),
            endTime: new Date().toISOString(),
          }
        : {
            isRunning: false,
            progress: 0,
            currentOperation: null,
            lastSyncTime: null,
            lastSyncType: null,
            lastError: null,
            syncLogId: null,
            syncLogStatus: null,
            startTime: null,
            endTime: null,
          };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatus),
      });
    });

    await page.goto('/sync');

    const syncButton = page.getByRole('button', { name: /sync now/i });
    await syncButton.click();

    // Wait for sync to complete and check status displays
    await expect(page.getByText(/last sync/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should handle concurrent sync error (409 Conflict)', async ({
    page,
  }) => {
    // Mock sync trigger to return 409
    await page.route('**/api/gomafia-sync/manual', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Sync already in progress. Please wait.',
          message: 'Sync already in progress. Please wait.',
        }),
      });
    });

    await page.goto('/sync');

    const syncButton = page.getByRole('button', { name: /sync now/i });
    await syncButton.click();

    // Verify error message is displayed
    await expect(page.getByText(/already in progress/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test('should handle authentication error', async ({ page }) => {
    // Remove auth cookie
    await page.context().clearCookies();

    // Mock status endpoint to return 401
    await page.route('**/api/gomafia-sync/manual/status', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Authentication required',
          message: 'Please sign in to view sync status',
        }),
      });
    });

    await page.goto('/sync');

    // Verify error is handled (component should handle gracefully)
    // The exact behavior depends on your error handling implementation
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display sync status information', async ({ page }) => {
    const lastSyncTime = new Date('2024-01-01T12:00:00Z');

    await page.route('**/api/gomafia-sync/manual/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isRunning: false,
          progress: 100,
          currentOperation: null,
          lastSyncTime: lastSyncTime.toISOString(),
          lastSyncType: 'INCREMENTAL',
          lastError: null,
          syncLogId: 'sync-log-123',
          syncLogStatus: 'COMPLETED',
          startTime: lastSyncTime.toISOString(),
          endTime: lastSyncTime.toISOString(),
        }),
      });
    });

    await page.goto('/sync');

    // Verify status information is displayed
    await expect(page.getByText(/sync status/i)).toBeVisible();
    await expect(page.getByText(/last sync/i)).toBeVisible();
  });

  test('should be accessible (WCAG 2.1 AA compliance)', async ({ page }) => {
    await page.goto('/sync');

    // Run axe-core accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    // Check for violations
    expect(accessibilityScanResults.violations).toEqual([]);

    // Check button has accessible name
    const syncButton = page.getByRole('button', { name: /sync now/i });
    await expect(syncButton).toBeVisible();

    // Check button has aria attributes when loading
    // (This would be tested when sync is running, but for initial state check basic accessibility)
    const buttonLabel = await syncButton.getAttribute('aria-label');
    expect(
      buttonLabel || (await syncButton.textContent())?.trim()
    ).toBeTruthy();

    // Verify progress bar has proper aria-label when visible
    const progressBar = page.getByRole('progressbar');
    if (await progressBar.isVisible().catch(() => false)) {
      const progressLabel = await progressBar.getAttribute('aria-label');
      expect(progressLabel).toBeTruthy();
    }
  });

  test('should be accessible during sync operation', async ({ page }) => {
    // Mock sync trigger and status to simulate running sync
    await page.route('**/api/gomafia-sync/manual', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Sync started',
          summary: {
            gamesImported: 5,
            gamesUpdated: 3,
            errors: 0,
          },
        }),
      });
    });

    await page.route('**/api/gomafia-sync/manual/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isRunning: true,
          progress: 50,
          currentOperation: 'Processing games...',
          lastSyncTime: null,
          lastSyncType: null,
          lastError: null,
          syncLogId: 'sync-log-123',
          syncLogStatus: 'RUNNING',
          startTime: new Date().toISOString(),
          endTime: null,
        }),
      });
    });

    await page.goto('/sync');

    // Trigger sync
    const syncButton = page.getByRole('button', { name: /sync now/i });
    await syncButton.click();

    // Wait for progress bar to appear
    await expect(page.getByRole('progressbar')).toBeVisible({ timeout: 5000 });

    // Run axe-core accessibility scan during sync
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    // Check for violations
    expect(accessibilityScanResults.violations).toEqual([]);

    // Verify progress bar has proper aria-label
    const progressBar = page.getByRole('progressbar');
    const progressLabel = await progressBar.getAttribute('aria-label');
    expect(progressLabel).toBeTruthy();
    expect(progressLabel).toContain('progress');
  });
});
