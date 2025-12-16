/**
 * E2E Tests for Concurrent Import Prevention
 *
 * Tests Story 2.8: Concurrent Import Prevention
 * - Start import → Attempt second import → Verify rejection
 * - Verify error message displayed in UI
 * - Verify existing import status shown
 * - Verify import button disabled during import
 * - Verify concurrent import from different browser tab prevented
 */

import { test, expect } from '@playwright/test';

test.describe('Concurrent Import Prevention E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sync page
    await page.goto('/sync');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Data Synchronization');
  });

  test('should prevent concurrent import attempts from same user', async ({
    page,
  }) => {
    // Mock import status to show no running import initially
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: false,
            progress: 0,
            currentOperation: null,
            lastError: null,
          }),
        });
      } else if (route.request().method() === 'POST') {
        // First POST request - start import
        const requestCount =
          route.request().headers()['x-request-count'] || '0';
        if (parseInt(requestCount) === 0) {
          // First request - start import
          await route.fulfill({
            status: 202,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Initial import started successfully',
              syncLogId: 'test-sync-log-1',
            }),
          });
        } else {
          // Second request - should be rejected
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error:
                'Import already in progress. Please wait for current import to complete.',
              code: 'IMPORT_RUNNING',
              details: {
                progress: 25,
                currentOperation: 'Processing CLUBS phase',
                currentPhase: 'CLUBS',
                estimatedTimeRemaining: 3600,
                startTime: new Date().toISOString(),
              },
            }),
          });
        }
      }
    });

    // Find and click sync button
    const syncButton = page.getByRole('button', { name: /sync now/i });
    await expect(syncButton).toBeVisible();
    await syncButton.click();

    // Wait for import to start
    await expect(syncButton).toBeDisabled();
    await expect(page.getByText(/import already in progress/i)).toBeVisible({
      timeout: 5000,
    });

    // Try to trigger another import (should be prevented by UI)
    // The button should be disabled
    await expect(syncButton).toBeDisabled();

    // Verify error message is shown if we try to trigger via API
    const response = await page.request.post('/api/gomafia-sync/import', {
      data: {},
    });

    expect(response.status()).toBe(409);
    const errorData = await response.json();
    expect(errorData.error).toContain('Import already in progress');
    expect(errorData.code).toBe('IMPORT_RUNNING');
    expect(errorData.details).toBeDefined();
    expect(errorData.details.progress).toBeDefined();
  });

  test('should display existing import status when concurrent import attempted', async ({
    page,
  }) => {
    // Mock import status to show running import
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: true,
            progress: 45,
            currentOperation: 'Processing PLAYERS phase',
            lastError: null,
          }),
        });
      } else if (route.request().method() === 'POST') {
        // Reject with detailed status
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error:
              'Import already in progress. Please wait for current import to complete.',
            code: 'IMPORT_RUNNING',
            details: {
              progress: 45,
              currentOperation: 'Processing PLAYERS phase',
              currentPhase: 'PLAYERS',
              estimatedTimeRemaining: 1800,
              startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            },
          }),
        });
      }
    });

    // Navigate to page (should show running import)
    await page.reload();
    await expect(page.locator('h1')).toContainText('Data Synchronization');

    // Verify sync button is disabled
    const syncButton = page.getByRole('button', { name: /sync now|syncing/i });
    await expect(syncButton).toBeDisabled();

    // Verify message is shown
    await expect(page.getByText(/import already in progress/i)).toBeVisible();

    // Verify progress is displayed
    await expect(page.getByText(/45%/i)).toBeVisible();
    await expect(page.getByText(/processing players phase/i)).toBeVisible();
  });

  test('should disable import button during import', async ({ page }) => {
    // Mock import status to show running import
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: true,
            progress: 30,
            currentOperation: 'Processing CLUBS phase',
            lastError: null,
          }),
        });
      }
    });

    // Navigate to page
    await page.reload();
    await expect(page.locator('h1')).toContainText('Data Synchronization');

    // Verify button is disabled
    const syncButton = page.getByRole('button', { name: /sync now|syncing/i });
    await expect(syncButton).toBeDisabled();

    // Verify button shows "Syncing..." text
    await expect(syncButton).toContainText(/syncing/i);

    // Verify progress is shown
    await expect(page.getByText(/30%/i)).toBeVisible();
  });

  test('should prevent concurrent import from different browser tab', async ({
    browser,
  }) => {
    // Create two browser contexts (simulating different tabs)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    let importStarted = false;

    // Mock import endpoint to track requests
    await page1.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: importStarted,
            progress: importStarted ? 10 : 0,
            currentOperation: importStarted ? 'Starting import...' : null,
            lastError: null,
          }),
        });
      } else if (route.request().method() === 'POST') {
        if (!importStarted) {
          // First request - start import
          importStarted = true;
          await route.fulfill({
            status: 202,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Initial import started successfully',
              syncLogId: 'test-sync-log-1',
            }),
          });
        } else {
          // Second request - reject
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error:
                'Import already in progress. Please wait for current import to complete.',
              code: 'IMPORT_RUNNING',
              details: {
                progress: 10,
                currentOperation: 'Starting import...',
                currentPhase: 'CLUBS',
                estimatedTimeRemaining: 7200,
                startTime: new Date().toISOString(),
              },
            }),
          });
        }
      }
    });

    // Set up same route for page2
    await page2.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: importStarted,
            progress: importStarted ? 10 : 0,
            currentOperation: importStarted ? 'Starting import...' : null,
            lastError: null,
          }),
        });
      } else if (route.request().method() === 'POST') {
        if (!importStarted) {
          importStarted = true;
          await route.fulfill({
            status: 202,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Initial import started successfully',
              syncLogId: 'test-sync-log-1',
            }),
          });
        } else {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error:
                'Import already in progress. Please wait for current import to complete.',
              code: 'IMPORT_RUNNING',
              details: {
                progress: 10,
                currentOperation: 'Starting import...',
                currentPhase: 'CLUBS',
                estimatedTimeRemaining: 7200,
                startTime: new Date().toISOString(),
              },
            }),
          });
        }
      }
    });

    // Navigate both pages to sync page
    await page1.goto('/sync');
    await page2.goto('/sync');

    // Start import from page1
    const syncButton1 = page1.getByRole('button', { name: /sync now/i });
    await syncButton1.click();

    // Wait a bit for import to start
    await page1.waitForTimeout(1000);

    // Try to start import from page2 (should be prevented)
    const syncButton2 = page2.getByRole('button', { name: /sync now/i });

    // Button should be disabled or import should be rejected
    // Check if button is disabled (UI prevention)
    const isDisabled = await syncButton2.isDisabled();

    if (!isDisabled) {
      // If button is not disabled, try clicking (should show error)
      await syncButton2.click();
      await expect(page2.getByText(/import already in progress/i)).toBeVisible({
        timeout: 5000,
      });
    } else {
      // Button is disabled - that's also correct behavior
      expect(isDisabled).toBe(true);
    }

    // Clean up
    await context1.close();
    await context2.close();
  });

  test('should show error message with status details on concurrent import attempt', async ({
    page,
  }) => {
    // Mock import to be running
    await page.route('**/api/gomafia-sync/import', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isRunning: true,
            progress: 60,
            currentOperation: 'Processing GAMES phase',
            lastError: null,
          }),
        });
      } else if (route.request().method() === 'POST') {
        // Reject with detailed error
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error:
              'Import already in progress. Please wait for current import to complete.',
            code: 'IMPORT_RUNNING',
            details: {
              progress: 60,
              currentOperation: 'Processing GAMES phase',
              currentPhase: 'GAMES',
              estimatedTimeRemaining: 1200,
              startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            },
          }),
        });
      }
    });

    // Navigate to page
    await page.reload();

    // Verify error message is displayed with details
    await expect(page.getByText(/import already in progress/i)).toBeVisible();

    // Verify status information is shown
    await expect(page.getByText(/60%/i)).toBeVisible();
    await expect(page.getByText(/processing games phase/i)).toBeVisible();
  });
});
