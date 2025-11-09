/**
 * E2E Tests for Manual Import Cancellation with Clean Stop
 *
 * Tests graceful cancellation behavior when:
 * - User clicks cancel button during import
 * - Import is cancelled mid-phase
 * - Import is cancelled mid-batch
 * - Checkpoint is saved for resume
 *
 * Pattern: AbortController with graceful shutdown (p-queue pattern)
 */

import { test, expect } from '@playwright/test';

test.describe('Import Cancellation with Clean Stop E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import management page
    await page.goto('/admin/import');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Import Management');
  });

  test('should cancel running import gracefully', async ({ page }) => {
    // Mock import status APIs
    let isRunning = false;

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        isRunning = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Import started successfully',
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        isRunning = false;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message:
              'Import cancellation requested. Saving checkpoint for resume capability.',
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning,
            progress: isRunning ? 35 : 35,
            currentOperation: isRunning
              ? 'Executing PLAYERS phase'
              : 'Cancelling import... (saving checkpoint)',
            lastError: null,
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

    // Click cancel button
    const cancelButton = page.getByRole('button', { name: /cancel import/i });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Should show cancellation in progress
    await expect(page.getByText(/cancell/i)).toBeVisible({ timeout: 3000 });

    // Should show checkpoint message
    await expect(page.getByText(/checkpoint/i)).toBeVisible({ timeout: 5000 });
  });

  test('should save checkpoint when cancelled mid-phase', async ({ page }) => {
    let cancellationRequested = false;

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
      } else if (route.request().method() === 'DELETE') {
        cancellationRequested = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message:
              'Import cancelled. Checkpoint saved at TOURNAMENTS phase, batch 12.',
            checkpoint: {
              phase: 'TOURNAMENTS',
              batch: 12,
              lastProcessedId: 'tournament-245',
              progress: 55,
            },
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: !cancellationRequested,
            progress: 55,
            currentOperation: cancellationRequested
              ? null
              : 'Executing TOURNAMENTS phase',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Start import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();
    await page.waitForTimeout(1000);

    // Cancel import
    const cancelButton = page.getByRole('button', { name: /cancel import/i });
    await cancelButton.click();

    // Should show checkpoint info
    await expect(page.getByText(/checkpoint.*saved/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show cancel button only when import is running', async ({
    page,
  }) => {
    // Mock not running
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 0,
            currentOperation: null,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();

    // Should show start button, not cancel
    await expect(
      page.getByRole('button', { name: /start import/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /cancel import/i })
    ).not.toBeVisible();
  });

  test('should disable cancel button during cancellation', async ({ page }) => {
    let cancelling = false;

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Import started' }),
        });
      } else if (route.request().method() === 'DELETE') {
        cancelling = true;
        // Simulate slow cancellation
        await page.waitForTimeout(2000);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Cancelled' }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: !cancelling,
            progress: 40,
            currentOperation: cancelling
              ? 'Cancelling...'
              : 'Executing PLAYERS phase',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Start import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();
    await page.waitForTimeout(500);

    // Click cancel
    const cancelButton = page.getByRole('button', { name: /cancel import/i });
    await cancelButton.click();

    // Button should be disabled during cancellation
    await expect(page.getByText(/cancelling/i)).toBeVisible({ timeout: 2000 });
    const cancellingButton = page.getByText(/cancelling/i).closest('button');
    if (cancellingButton) {
      await expect(cancellingButton).toBeDisabled();
    }
  });

  test('should allow resume after manual cancellation', async ({ page }) => {
    let isCancelled = false;

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        const postData = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: postData?.resume
              ? 'Import resumed from checkpoint'
              : 'Import started',
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        isCancelled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Import cancelled. Checkpoint saved.',
            checkpoint: { phase: 'GAMES', progress: 70 },
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: isCancelled ? 70 : 0,
            currentOperation: null,
            lastError: null,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Start import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();
    await page.waitForTimeout(500);

    // Cancel import
    const cancelButton = page.getByRole('button', { name: /cancel import/i });
    await cancelButton.click();
    await page.waitForTimeout(1000);

    // Reload to see cancelled state
    await page.reload();

    // Should show retry button (for resume)
    const retryButton = page.getByRole('button', {
      name: /retry import|start import/i,
    });
    await expect(retryButton).toBeVisible();

    // Click to resume
    await retryButton.click();

    // Should show success message
    await expect(
      page.getByText(/admin\/import.*(started|resumed)/i)
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test('should handle cancellation error gracefully', async ({ page }) => {
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Import started' }),
        });
      } else if (route.request().method() === 'DELETE') {
        // Simulate cancellation error
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'No import operation is currently running',
            code: 'NO_IMPORT_RUNNING',
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: true,
            progress: 25,
            currentOperation: 'Executing CLUBS phase',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Start import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();
    await page.waitForTimeout(500);

    // Try to cancel
    const cancelButton = page.getByRole('button', { name: /cancel import/i });
    await cancelButton.click();

    // Should show error (maybe in console or UI)
    // At minimum, should not crash the app
    await page.waitForTimeout(1000);

    // Page should still be functional
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display clear cancellation status in UI', async ({ page }) => {
    let currentStatus = 'running';

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        currentStatus = 'running';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Import started' }),
        });
      } else if (route.request().method() === 'DELETE') {
        currentStatus = 'cancelling';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message:
              'Import cancellation requested. Saving checkpoint for resume capability.',
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: currentStatus === 'running',
            progress: 50,
            currentOperation:
              currentStatus === 'cancelling'
                ? 'Cancelling import... (saving checkpoint)'
                : 'Executing TOURNAMENTS phase',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Start import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();
    await page.waitForTimeout(500);

    // Should show running status
    await expect(page.getByText(/executing.*tournaments/i)).toBeVisible();

    // Cancel import
    const cancelButton = page.getByRole('button', { name: /cancel import/i });
    await cancelButton.click();

    // Should show cancelling status
    await expect(page.getByText(/cancelling.*checkpoint/i)).toBeVisible({
      timeout: 3000,
    });
  });

  test('should preserve validation metrics after cancellation', async ({
    page,
  }) => {
    let cancelled = false;

    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Import started' }),
        });
      } else if (route.request().method() === 'DELETE') {
        cancelled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Cancelled' }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: !cancelled,
            progress: 45,
            currentOperation: cancelled ? null : 'Executing PLAYERS phase',
            validation: {
              totalRecordsProcessed: 1800,
              validRecords: 1750,
              invalidRecords: 50,
              validationRate: 97.22,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Start import
    const startButton = page.getByRole('button', { name: /start import/i });
    await startButton.click();
    await page.waitForTimeout(500);

    // Cancel
    const cancelButton = page.getByRole('button', { name: /cancel import/i });
    await cancelButton.click();
    await page.waitForTimeout(1000);

    // Reload to see cancelled state with metrics
    await page.reload();

    // Should still show validation metrics
    // (This would be in ValidationSummaryCard if it appears for cancelled imports)
    await expect(page.getByText(/1800/i)).toBeVisible({ timeout: 5000 });
  });
});
