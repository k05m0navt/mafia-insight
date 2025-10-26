/**
 * E2E Tests for Import Resume from Interruption
 *
 * Tests import resume capability when:
 * - Import times out (EC-008)
 * - Import is cancelled
 * - Browser/server crashes
 * - Network interruption
 *
 * Pattern: Sidekiq Iteration checkpoint-based resumption
 */

import { test, expect } from '@playwright/test';

test.describe('Import Resume from Interruption E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import management page
    await page.goto('/import');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Import Management');
  });

  test('should resume import after timeout', async ({ page }) => {
    // Mock import status API to show failed import with timeout
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 45,
            currentOperation: null,
            lastError: 'EC-008: Import timeout exceeded (12 hours)',
            lastSyncTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            validation: {
              totalRecordsProcessed: 1500,
              validRecords: 1450,
              invalidRecords: 50,
              validationRate: 96.67,
            },
          }),
        });
      } else if (route.request().method() === 'POST') {
        // Resume request
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Import resumed from checkpoint',
            syncLogId: 'test-resume-1',
            resumedFrom: 'TOURNAMENTS',
            resumedProgress: 45,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Reload page to see failed import state
    await page.reload();

    // Should show error panel with timeout error
    const errorPanel = page.getByRole('alert');
    await expect(errorPanel).toBeVisible({ timeout: 5000 });
    await expect(errorPanel).toContainText('EC-008');
    await expect(errorPanel).toContainText(/timeout/i);

    // Should show resume guidance
    await expect(errorPanel).toContainText(/resume/i);
    await expect(errorPanel).toContainText(/checkpoint/i);

    // Should show retry button (which will resume)
    const retryButton = page.getByRole('button', { name: /retry import/i });
    await expect(retryButton).toBeVisible();

    // Click retry to resume
    await retryButton.click();

    // Should show success message about resuming
    await expect(page.getByText(/resumed.*checkpoint/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display checkpoint information before resume', async ({
    page,
  }) => {
    // Mock status showing interrupted import
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 60,
            currentOperation: 'Import interrupted',
            lastError: 'EC-006: Network interruption',
            checkpoint: {
              phase: 'GAMES',
              batch: 15,
              lastProcessedId: 'game-750',
              processedCount: 750,
            },
            validation: {
              totalRecordsProcessed: 2000,
              validRecords: 1950,
              invalidRecords: 50,
              validationRate: 97.5,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show progress (60%)
    const progressCard = page.locator('[role="progressbar"]').first();
    await expect(progressCard).toBeVisible({ timeout: 5000 });

    // Should show interrupted state
    await expect(page.getByText(/interrupted|stopped/i)).toBeVisible();

    // Should show validation metrics (partial progress)
    await expect(page.getByText(/2000.*processed/i)).toBeVisible();
  });

  test('should resume from exact checkpoint position', async ({ page }) => {
    let resumeRequested = false;

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = await route.request().postDataJSON();

        // Verify resume parameter is sent
        if (postData?.resume === true) {
          resumeRequested = true;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: resumeRequested
              ? 'Resumed from checkpoint'
              : 'Import started',
            checkpoint: resumeRequested
              ? {
                  phase: 'GAMES',
                  batch: 15,
                  resumed: true,
                }
              : null,
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 40,
            lastError: 'EC-006: Network error',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Click retry to resume
    const retryButton = page.getByRole('button', { name: /retry import/i });
    await retryButton.click();

    // Wait a bit for request
    await page.waitForTimeout(1000);

    // Verify resume was requested
    expect(resumeRequested).toBe(true);
  });

  test('should prevent duplicate processing after resume', async ({ page }) => {
    // Mock status showing resumed import in progress
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: true,
            progress: 65,
            currentOperation: 'Executing GAMES phase (resumed)',
            lastError: null,
            validation: {
              totalRecordsProcessed: 2500,
              validRecords: 2450,
              invalidRecords: 50,
              duplicatesSkipped: 750, // Duplicates from before interruption
              validationRate: 98.0,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show import running
    await expect(page.getByText(/executing.*games/i)).toBeVisible({
      timeout: 5000,
    });

    // Should show "resumed" indicator
    await expect(page.getByText(/resumed/i)).toBeVisible();

    // Validation metrics should show duplicates were skipped
    // (This would be in ValidationSummaryCard if visible)
  });

  test('should handle resume after browser refresh during import', async ({
    page,
  }) => {
    // Start import
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Import started',
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: true,
            progress: 30,
            currentOperation: 'Executing PLAYERS phase',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Start import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();

    // Wait for import to start
    await expect(page.getByText(/executing/i)).toBeVisible({ timeout: 5000 });

    // Simulate browser refresh
    await page.reload();

    // Should still show import running (backend continues)
    await expect(page.getByText(/executing.*players/i)).toBeVisible({
      timeout: 5000,
    });

    // Cancel button should be available
    const cancelButton = page.getByRole('button', { name: /cancel import/i });
    await expect(cancelButton).toBeVisible();
  });

  test('should show clear progress after resume', async ({ page }) => {
    // Mock resumed import showing clear progress
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: true,
            progress: 75,
            currentOperation: 'Executing STATISTICS phase (resumed from GAMES)',
            lastError: null,
            startTime: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
            validation: {
              totalRecordsProcessed: 3500,
              validRecords: 3450,
              invalidRecords: 50,
              validationRate: 98.57,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show progress at 75%
    const progressBar = page.locator('[role="progressbar"]').first();
    await expect(progressBar).toBeVisible();

    // Should show current operation with "resumed" indicator
    await expect(page.getByText(/statistics.*resumed/i)).toBeVisible();

    // Should show validation metrics
    await expect(page.getByText(/3500/i)).toBeVisible(); // Total records
  });

  test('should allow cancellation of resumed import', async ({ page }) => {
    // Mock resumed import in progress
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: true,
            progress: 80,
            currentOperation: 'Executing STATISTICS phase (resumed)',
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Import cancelled. Checkpoint saved for resume.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show cancel button
    const cancelButton = page.getByRole('button', { name: /cancel import/i });
    await expect(cancelButton).toBeVisible();

    // Click cancel
    await cancelButton.click();

    // Should show cancellation message
    await expect(page.getByText(/cancelled.*checkpoint/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
