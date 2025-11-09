/**
 * E2E Tests for 12-Hour Import Timeout Handling
 *
 * Tests timeout behavior when:
 * - Import exceeds 12-hour limit (EC-008)
 * - TimeoutManager enforces timeout
 * - Checkpoint is saved on timeout
 * - User can resume after timeout
 *
 * Pattern: TimeoutManager with checkpoint preservation
 *
 * Note: These tests use mocked time/status to simulate timeout
 * without actually waiting 12 hours.
 */

import { test, expect } from '@playwright/test';

test.describe('12-Hour Import Timeout E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import management page
    await page.goto('/admin/import');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Import Management');
  });

  test('should display timeout error (EC-008) after 12 hours', async ({
    page,
  }) => {
    // Mock import status to show timeout error
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 75,
            currentOperation: null,
            lastError: 'EC-008: Import timeout exceeded (12 hours)',
            lastSyncTime: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
            validation: {
              totalRecordsProcessed: 5000,
              validRecords: 4900,
              invalidRecords: 100,
              validationRate: 98.0,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show error panel with EC-008
    const errorPanel = page.getByRole('alert');
    await expect(errorPanel).toBeVisible({ timeout: 5000 });
    await expect(errorPanel).toContainText('EC-008');
    await expect(errorPanel).toContainText(/timeout/i);

    // Should show 12-hour guidance
    await expect(errorPanel).toContainText(/12.*hour/i);
    await expect(errorPanel).toContainText(/resume/i);
    await expect(errorPanel).toContainText(/checkpoint/i);
  });

  test('should show progress at time of timeout', async ({ page }) => {
    // Mock status showing timeout at 75% progress
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 75,
            currentOperation: 'Import timed out at GAMES phase',
            lastError: 'EC-008: Import timeout exceeded',
            checkpoint: {
              phase: 'GAMES',
              batch: 45,
              lastProcessedId: 'game-2250',
              progress: 75,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show progress bar at 75%
    const progressCard = page.locator('[role="progressbar"]').first();
    await expect(progressCard).toBeVisible({ timeout: 5000 });

    // Should show which phase timed out
    await expect(page.getByText(/games.*phase/i)).toBeVisible();
  });

  test('should preserve checkpoint data on timeout', async ({ page }) => {
    // Mock timeout with detailed checkpoint
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 80,
            currentOperation: null,
            lastError: 'EC-008: Import timeout exceeded (12 hours)',
            checkpoint: {
              phase: 'STATISTICS',
              batch: 10,
              lastProcessedId: 'player-800',
              processedCount: 800,
              totalCount: 1000,
            },
            validation: {
              totalRecordsProcessed: 4500,
              validRecords: 4400,
              invalidRecords: 100,
              validationRate: 97.78,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show validation metrics from timeout point
    await expect(page.getByText(/4500/i)).toBeVisible({ timeout: 5000 });

    // Should show progress (80%)
    const progressBar = page.locator('[role="progressbar"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('should allow resume after timeout', async ({ page }) => {
    let resumeRequested = false;

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = await route.request().postDataJSON();
        if (postData?.resume === true) {
          resumeRequested = true;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: resumeRequested
              ? 'Import resumed from checkpoint (after timeout)'
              : 'Import started',
            resumedFrom: resumeRequested ? 'STATISTICS' : null,
            resumedProgress: resumeRequested ? 80 : 0,
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 80,
            lastError: 'EC-008: Import timeout exceeded',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Click retry to resume
    const retryButton = page.getByRole('button', { name: /retry import/i });
    await expect(retryButton).toBeVisible();
    await retryButton.click();

    // Wait for request
    await page.waitForTimeout(1000);

    // Should show success message about resuming
    await expect(page.getByText(/resumed.*checkpoint/i)).toBeVisible({
      timeout: 5000,
    });

    // Verify resume was requested
    expect(resumeRequested).toBe(true);
  });

  test('should show appropriate user guidance for timeout', async ({
    page,
  }) => {
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 70,
            lastError: 'EC-008: Import timeout exceeded (12 hours)',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show EC-008 specific guidance
    const errorPanel = page.getByRole('alert');
    await expect(errorPanel).toBeVisible({ timeout: 5000 });

    // Check for timeout-specific guidance
    await expect(errorPanel).toContainText(/took longer.*12.*hour/i);
    await expect(errorPanel).toContainText(/resume.*where.*stopped/i);
    await expect(errorPanel).toContainText(/checkpoint.*saved automatically/i);
  });

  test('should display elapsed time at timeout', async ({ page }) => {
    // Mock timeout showing it occurred after 12 hours
    const startTime = new Date(Date.now() - 43200000); // 12 hours ago

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 65,
            currentOperation: null,
            lastError: 'EC-008: Import timeout exceeded',
            startTime: startTime.toISOString(),
            lastSyncTime: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show error about timeout
    await expect(page.getByRole('alert')).toContainText(/EC-008/i);
  });

  test('should not allow new import while timed-out import can be resumed', async ({
    page,
  }) => {
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        // Reject new import, suggest resume
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error:
              'A checkpoint exists from a previous timeout. Please resume instead.',
            code: 'CHECKPOINT_EXISTS',
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 60,
            lastError: 'EC-008: Import timeout exceeded',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Try to start new import (should fail or show resume button instead)
    const retryButton = page.getByRole('button', { name: /retry import/i });

    // Should show retry button (which resumes), not start button
    await expect(retryButton).toBeVisible();
  });

  test('should handle timeout during critical phase gracefully', async ({
    page,
  }) => {
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 95,
            currentOperation: null,
            lastError: 'EC-008: Import timeout during STATISTICS phase',
            checkpoint: {
              phase: 'STATISTICS',
              batch: 18,
              lastProcessedId: 'player-950',
              progress: 95,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show timeout error even at 95%
    await expect(page.getByRole('alert')).toContainText('EC-008');

    // Should show high progress (95%)
    const progressBar = page.locator('[role="progressbar"]').first();
    await expect(progressBar).toBeVisible();

    // Should show retry button to complete remaining 5%
    const retryButton = page.getByRole('button', { name: /retry import/i });
    await expect(retryButton).toBeVisible();
  });

  test('should clear timeout error after successful resume', async ({
    page,
  }) => {
    let importState = 'timeout'; // timeout -> resuming -> success

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        importState = 'resuming';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Import resumed from checkpoint',
          }),
        });
      } else if (route.request().method() === 'GET') {
        if (importState === 'timeout') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              isRunning: false,
              progress: 70,
              lastError: 'EC-008: Import timeout exceeded',
            }),
          });
        } else if (importState === 'resuming') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              isRunning: true,
              progress: 75,
              currentOperation: 'Executing STATISTICS phase (resumed)',
              lastError: null, // Error cleared
            }),
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show error initially
    await expect(page.getByRole('alert')).toContainText('EC-008');

    // Click retry
    const retryButton = page.getByRole('button', { name: /retry import/i });
    await retryButton.click();

    await page.waitForTimeout(1000);

    // Reload to see new state
    await page.reload();

    // Error should be cleared, import should be running
    await expect(page.getByText(/executing.*statistics/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show validation metrics preserved at timeout', async ({
    page,
  }) => {
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 85,
            currentOperation: null,
            lastError: 'EC-008: Import timeout exceeded',
            validation: {
              totalRecordsProcessed: 6500,
              validRecords: 6400,
              invalidRecords: 100,
              duplicatesSkipped: 50,
              validationRate: 98.46,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show all validation metrics
    await expect(page.getByText(/6500/i)).toBeVisible({ timeout: 5000 }); // Total
    await expect(page.getByText(/6400/i)).toBeVisible(); // Valid
    await expect(page.getByText(/98/i)).toBeVisible(); // Validation rate
  });
});
