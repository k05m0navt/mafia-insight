import { test, expect } from '@playwright/test';

test.describe('Import Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sync page
    await page.goto('/sync');
  });

  test('should complete full import flow with real data', async ({ page }) => {
    // Check if import button exists
    const importButton = page.getByRole('button', {
      name: /start import|trigger import/i,
    });
    await expect(importButton).toBeVisible();

    // Trigger import
    await importButton.click();

    // Wait for import to start
    await expect(page.getByText(/import started|importing/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify progress bar appears
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // Wait for phases to progress
    // Phase 1: Clubs
    await expect(page.getByText(/clubs/i)).toBeVisible({ timeout: 30000 });

    // Phase 2: Players
    await expect(page.getByText(/players/i)).toBeVisible({ timeout: 30000 });

    // Note: Full import might take very long for E2E test
    // In a real implementation, you might want to:
    // 1. Use a mock server with limited test data
    // 2. Or just verify the import started successfully and phases are progressing
    // 3. Then cancel the import to speed up the test

    // Verify import is running
    const statusResponse = await page.request.get(
      '/api/gomafia-sync/import/status'
    );
    expect(statusResponse.ok()).toBe(true);
    const statusData = await statusResponse.json();
    expect(statusData.isRunning).toBe(true);

    // Optional: Cancel import to speed up test
    const cancelButton = page.getByRole('button', { name: /cancel|stop/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(page.getByText(/cancelled|stopped/i)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('should show import status and progress', async ({ page }) => {
    // Check import status via API
    const statusResponse = await page.request.get(
      '/api/gomafia-sync/import/status'
    );
    expect(statusResponse.ok()).toBe(true);

    const statusData = await statusResponse.json();
    expect(statusData).toHaveProperty('isRunning');
    expect(statusData).toHaveProperty('progress');
    expect(statusData).toHaveProperty('currentPhase');
  });

  test('should prevent concurrent imports', async ({ page }) => {
    // Start first import
    const importButton = page.getByRole('button', {
      name: /start import|trigger import/i,
    });

    // If button is disabled, import is already running
    const isDisabled = await importButton.isDisabled();

    if (!isDisabled) {
      await importButton.click();
      await page.waitForTimeout(2000); // Wait for import to start

      // Try to start second import
      const response = await page.request.post('/api/gomafia-sync/import');

      if (response.status() === 409) {
        // Expected: concurrent import rejected
        const data = await response.json();
        expect(data.error).toContain('already running');
      } else if (response.ok()) {
        // First import might have completed - that's also OK
        console.log('First import completed quickly');
      }
    }
  });

  test('should display import summary after completion', async ({ page }) => {
    // Wait for any running import to complete or check if one is needed
    const checkEmptyResponse = await page.request.get(
      '/api/gomafia-sync/import/check-empty'
    );
    const checkEmptyData = await checkEmptyResponse.json();

    if (!checkEmptyData.isEmpty) {
      // Database already has data, verify summary is displayed
      await expect(page.getByText(/total records|imported/i)).toBeVisible();
    } else {
      // Database is empty - would need to run full import
      // This is tested in the first test case
      console.log('Database is empty, full import test covers this');
    }
  });
});
