import { test, expect } from '@playwright/test';

test.describe('Data Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import page
    await page.goto('/admin/import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
  });

  test('should display import dashboard with progress indicators', async ({
    page,
  }) => {
    // Check main import dashboard elements
    await expect(
      page.locator('[data-testid="import-dashboard"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-status"]')).toBeVisible();

    // Check import controls
    await expect(
      page.locator('[data-testid="start-import-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="pause-import-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="stop-import-button"]')
    ).toBeVisible();
  });

  test('should start data import process', async ({ page }) => {
    // Click start import button
    await page.click('[data-testid="start-import-button"]');

    // Verify import started
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Importing'
    );
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();

    // Check progress indicators
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="progress-percentage"]')
    ).toBeVisible();
  });

  test('should display import progress with detailed metrics', async ({
    page,
  }) => {
    // Start import
    await page.click('[data-testid="start-import-button"]');

    // Wait for progress to update
    await page.waitForSelector('[data-testid="progress-percentage"]');

    // Check progress metrics
    await expect(page.locator('[data-testid="imported-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-speed"]')).toBeVisible();

    // Check time estimates
    await expect(
      page.locator('[data-testid="estimated-time-remaining"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="elapsed-time"]')).toBeVisible();
  });

  test('should handle import pause and resume', async ({ page }) => {
    // Start import
    await page.click('[data-testid="start-import-button"]');
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Importing'
    );

    // Pause import
    await page.click('[data-testid="pause-import-button"]');
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Paused'
    );

    // Resume import
    await page.click('[data-testid="resume-import-button"]');
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Importing'
    );
  });

  test('should stop import process', async ({ page }) => {
    // Start import
    await page.click('[data-testid="start-import-button"]');
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Importing'
    );

    // Stop import
    await page.click('[data-testid="stop-import-button"]');

    // Confirm stop dialog
    await expect(
      page.locator('[data-testid="confirm-stop-dialog"]')
    ).toBeVisible();
    await page.click('[data-testid="confirm-stop-button"]');

    // Verify import stopped
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Stopped'
    );
  });

  test('should display import logs and errors', async ({ page }) => {
    // Start import
    await page.click('[data-testid="start-import-button"]');

    // Check logs section
    await expect(page.locator('[data-testid="import-logs"]')).toBeVisible();
    await expect(page.locator('[data-testid="log-entries"]')).toBeVisible();

    // Check error handling
    await expect(page.locator('[data-testid="error-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-details"]')).toBeVisible();
  });

  test('should show import completion summary', async ({ page }) => {
    // Mock completed import
    await page.route('**/api/import/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'completed',
          progress: 100,
          imported: 1000,
          total: 1000,
          errors: 5,
          duration: 300000,
        }),
      });
    });

    // Navigate to import page
    await page.goto('/admin/import');

    // Check completion summary
    await expect(
      page.locator('[data-testid="completion-summary"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="imported-count"]')).toContainText(
      '1000'
    );
    await expect(page.locator('[data-testid="error-count"]')).toContainText(
      '5'
    );
    await expect(page.locator('[data-testid="duration"]')).toContainText(
      '5m 0s'
    );
  });

  test('should handle import errors gracefully', async ({ page }) => {
    // Mock import error
    await page.route('**/api/import/start', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Import failed',
          message: 'Database connection error',
        }),
      });
    });

    // Try to start import
    await page.click('[data-testid="start-import-button"]');

    // Check error display
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Database connection error'
    );

    // Check retry option
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should validate import data before starting', async ({ page }) => {
    // Check validation section
    await expect(
      page.locator('[data-testid="validation-section"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="data-source-select"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="validate-button"]')).toBeVisible();

    // Select data source
    await page.selectOption('[data-testid="data-source-select"]', 'gomafia');

    // Run validation
    await page.click('[data-testid="validate-button"]');

    // Check validation results
    await expect(
      page.locator('[data-testid="validation-results"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-status"]')
    ).toBeVisible();
  });

  test('should show import configuration options', async ({ page }) => {
    // Check configuration section
    await expect(page.locator('[data-testid="config-section"]')).toBeVisible();

    // Check import options
    await expect(
      page.locator('[data-testid="batch-size-input"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="concurrency-input"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="retry-attempts-input"]')
    ).toBeVisible();

    // Check data filters
    await expect(
      page.locator('[data-testid="date-range-picker"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="data-type-checkboxes"]')
    ).toBeVisible();
  });

  test('should display import history', async ({ page }) => {
    // Check history section
    await expect(page.locator('[data-testid="import-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="history-list"]')).toBeVisible();

    // Check history entries
    const historyEntries = page.locator('[data-testid="history-entry"]');
    await expect(historyEntries.first()).toBeVisible();

    // Check history details
    await expect(
      historyEntries.first().locator('[data-testid="import-date"]')
    ).toBeVisible();
    await expect(
      historyEntries.first().locator('[data-testid="import-status"]')
    ).toBeVisible();
    await expect(
      historyEntries.first().locator('[data-testid="import-duration"]')
    ).toBeVisible();
  });

  test('should allow import scheduling', async ({ page }) => {
    // Check schedule section
    await expect(
      page.locator('[data-testid="schedule-section"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="schedule-toggle"]')).toBeVisible();

    // Enable scheduling
    await page.click('[data-testid="schedule-toggle"]');

    // Check schedule options
    await expect(
      page.locator('[data-testid="schedule-frequency"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="schedule-time"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="schedule-timezone"]')
    ).toBeVisible();
  });

  test('should handle large dataset imports', async ({ page }) => {
    // Mock large dataset
    await page.route('**/api/import/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'importing',
          progress: 45,
          imported: 45000,
          total: 100000,
          errors: 0,
          duration: 180000,
        }),
      });
    });

    // Start import
    await page.click('[data-testid="start-import-button"]');

    // Check large dataset handling
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Importing'
    );
    await expect(
      page.locator('[data-testid="progress-percentage"]')
    ).toContainText('45%');
    await expect(page.locator('[data-testid="imported-count"]')).toContainText(
      '45,000'
    );
    await expect(page.locator('[data-testid="total-count"]')).toContainText(
      '100,000'
    );
  });

  test('should provide import analytics and insights', async ({ page }) => {
    // Check analytics section
    await expect(
      page.locator('[data-testid="import-analytics"]')
    ).toBeVisible();

    // Check performance metrics
    await expect(
      page.locator('[data-testid="import-speed-chart"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="error-rate-chart"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="throughput-metrics"]')
    ).toBeVisible();

    // Check insights
    await expect(page.locator('[data-testid="insights-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();
  });
});
