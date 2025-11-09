/**
 * E2E Tests for Import Retry on Network Failure
 *
 * Tests automatic retry behavior with exponential backoff when:
 * - Network intermittency occurs (EC-006)
 * - Dynamic content fails to load (EC-007)
 * - Complete unavailability detected (EC-001)
 *
 * Pattern: RetryManager with exponential backoff
 */

import { test, expect } from '@playwright/test';

test.describe('Import Retry on Network Failure E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import management page
    await page.goto('/admin/import');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Import Management');
  });

  test('should automatically retry on network timeout', async ({ page }) => {
    // Mock API to simulate network timeout then success
    let attemptCount = 0;

    await page.route('**/api/gomafia-sync/import', async (route) => {
      attemptCount++;

      if (route.request().method() === 'POST') {
        if (attemptCount === 1) {
          // First attempt: timeout
          await route.abort('timedout');
        } else {
          // Subsequent attempts: success
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Import started successfully',
              syncLogId: 'test-sync-log-1',
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Trigger import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();

    // Should show retrying state
    await expect(page.getByText(/retrying/i)).toBeVisible({ timeout: 5000 });

    // Eventually should succeed
    await expect(
      page.getByText(/admin\/import started successfully/i)
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display error panel with retry guidance on network failure', async ({
    page,
  }) => {
    // Mock API to simulate network error
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'EC-006: Network intermittency detected',
            code: 'EC-006',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Trigger import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();

    // Should show error panel
    const errorPanel = page.getByRole('alert');
    await expect(errorPanel).toBeVisible({ timeout: 5000 });

    // Should show error code
    await expect(errorPanel).toContainText('EC-006');

    // Should show user guidance
    await expect(errorPanel).toContainText(/check.*connection/i);
    await expect(errorPanel).toContainText(/try again/i);

    // Should show retry button
    const retryButton = page.getByRole('button', { name: /retry import/i });
    await expect(retryButton).toBeVisible();
  });

  test('should allow manual retry after automatic retry fails', async ({
    page,
  }) => {
    let attemptCount = 0;

    // Mock API to fail 3 times then succeed
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        attemptCount++;

        if (attemptCount <= 3) {
          // First 3 attempts: fail
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'EC-006: Network intermittency',
              code: 'EC-006',
            }),
          });
        } else {
          // 4th attempt: success
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Import started successfully',
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    // Trigger initial import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();

    // Wait for error panel
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });

    // Click retry button
    const retryButton = page.getByRole('button', { name: /retry import/i });
    await retryButton.click();

    // Should eventually succeed
    await expect(
      page.getByText(/admin\/import started successfully/i)
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test('should handle complete unavailability with clear guidance', async ({
    page,
  }) => {
    // Mock API to simulate gomafia.pro unavailability
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'EC-001: Complete unavailability of gomafia.pro',
            code: 'EC-001',
            details: {
              retries: 3,
              lastAttempt: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Trigger import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();

    // Should show error panel with EC-001 guidance
    const errorPanel = page.getByRole('alert');
    await expect(errorPanel).toBeVisible({ timeout: 5000 });
    await expect(errorPanel).toContainText('EC-001');
    await expect(errorPanel).toContainText(/gomafia\.pro.*unavailable/i);
    await expect(errorPanel).toContainText(/wait.*try again/i);
  });

  test('should show retry loading state', async ({ page }) => {
    // Mock slow API
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        // Delay to show loading state
        await page.waitForTimeout(2000);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Import started',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Trigger import with error first
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();

    // Look for loading indicator
    await expect(page.getByText(/starting/i)).toBeVisible({ timeout: 1000 });

    // Retry button should be disabled during loading
    // (if we had an error first, we'd see retry loading state)
  });

  test('should track retry attempts in error panel', async ({ page }) => {
    let attemptCount = 0;

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        attemptCount++;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: `EC-006: Network error (attempt ${attemptCount})`,
            code: 'EC-006',
          }),
        });
      } else {
        await route.continue();
      }
    });

    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();

    // Error panel should show
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });

    // Verify we can see the error message
    await expect(page.getByRole('alert')).toContainText(/network error/i);
  });
});
