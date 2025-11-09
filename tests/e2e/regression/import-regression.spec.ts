import { test, expect } from '@playwright/test';

test.describe('Import Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should maintain file upload functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');
    await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

    // Test file upload
    await page.setInputFiles(
      '[data-testid="file-upload-input"]',
      'test-data.csv'
    );
    await expect(page.locator('[data-testid="file-selected"]')).toBeVisible();

    // Verify file validation
    await expect(page.locator('[data-testid="file-valid"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-size"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-format"]')).toBeVisible();
  });

  test('should maintain data validation functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Upload invalid file
    await page.setInputFiles(
      '[data-testid="file-upload-input"]',
      'invalid-data.csv'
    );

    // Test validation
    await page.click('[data-testid="validate-button"]');
    await expect(
      page.locator('[data-testid="validation-errors"]')
    ).toBeVisible();

    // Verify error details
    await expect(page.locator('[data-testid="error-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-details"]')).toBeVisible();
  });

  test('should maintain import progress functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Upload valid file
    await page.setInputFiles(
      '[data-testid="file-upload-input"]',
      'valid-data.csv'
    );
    await page.click('[data-testid="start-import-button"]');

    // Test progress tracking
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="progress-percentage"]')
    ).toBeVisible();

    // Wait for completion
    await page.waitForSelector('[data-testid="import-complete"]', {
      timeout: 30000,
    });
    await expect(page.locator('[data-testid="import-complete"]')).toBeVisible();
  });

  test('should maintain data mapping functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Upload file
    await page.setInputFiles('[data-testid="file-upload-input"]', 'data.csv');

    // Test data mapping
    await page.click('[data-testid="mapping-tab"]');
    await expect(
      page.locator('[data-testid="mapping-interface"]')
    ).toBeVisible();

    // Test field mapping
    await page.selectOption('[data-testid="name-field-select"]', 'player_name');
    await page.selectOption(
      '[data-testid="rating-field-select"]',
      'player_rating'
    );
    await page.selectOption('[data-testid="club-field-select"]', 'club_name');

    // Verify mapping
    await expect(page.locator('[data-testid="mapping-valid"]')).toBeVisible();
  });

  test('should maintain duplicate detection functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Upload file with duplicates
    await page.setInputFiles(
      '[data-testid="file-upload-input"]',
      'duplicate-data.csv'
    );
    await page.click('[data-testid="start-import-button"]');

    // Test duplicate detection
    await expect(
      page.locator('[data-testid="duplicate-detection"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="duplicate-count"]')).toBeVisible();

    // Test duplicate resolution
    await page.click('[data-testid="resolve-duplicates-button"]');
    await expect(
      page.locator('[data-testid="duplicate-resolution"]')
    ).toBeVisible();
  });

  test('should maintain error handling functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Simulate import error
    await page.route('**/api/import/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Import failed' }),
      });
    });

    // Test error handling
    await page.setInputFiles('[data-testid="file-upload-input"]', 'data.csv');
    await page.click('[data-testid="start-import-button"]');

    // Verify error handling
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-details"]')).toBeVisible();
  });

  test('should maintain rollback functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Complete import
    await page.setInputFiles('[data-testid="file-upload-input"]', 'data.csv');
    await page.click('[data-testid="start-import-button"]');
    await page.waitForSelector('[data-testid="import-complete"]', {
      timeout: 30000,
    });

    // Test rollback
    await page.click('[data-testid="rollback-button"]');
    await expect(
      page.locator('[data-testid="rollback-confirmation"]')
    ).toBeVisible();

    // Confirm rollback
    await page.click('[data-testid="confirm-rollback-button"]');
    await expect(
      page.locator('[data-testid="rollback-complete"]')
    ).toBeVisible();
  });

  test('should maintain import history functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Test import history
    await page.click('[data-testid="history-tab"]');
    await expect(page.locator('[data-testid="import-history"]')).toBeVisible();

    // Verify history entries
    await expect(page.locator('[data-testid="history-entry"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-file"]')).toBeVisible();
  });

  test('should maintain data preview functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Upload file
    await page.setInputFiles('[data-testid="file-upload-input"]', 'data.csv');

    // Test data preview
    await page.click('[data-testid="preview-tab"]');
    await expect(page.locator('[data-testid="data-preview"]')).toBeVisible();

    // Verify preview data
    await expect(page.locator('[data-testid="preview-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-rows"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-columns"]')).toBeVisible();
  });

  test('should maintain batch processing functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Upload large file
    await page.setInputFiles(
      '[data-testid="file-upload-input"]',
      'large-data.csv'
    );

    // Test batch processing
    await page.click('[data-testid="batch-processing-toggle"]');
    await expect(
      page.locator('[data-testid="batch-size-input"]')
    ).toBeVisible();

    // Set batch size
    await page.fill('[data-testid="batch-size-input"]', '100');
    await page.click('[data-testid="start-import-button"]');

    // Verify batch processing
    await expect(page.locator('[data-testid="batch-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-batch"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-batches"]')).toBeVisible();
  });

  test('should maintain data transformation functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Upload file
    await page.setInputFiles('[data-testid="file-upload-input"]', 'data.csv');

    // Test data transformation
    await page.click('[data-testid="transformation-tab"]');
    await expect(
      page.locator('[data-testid="transformation-interface"]')
    ).toBeVisible();

    // Test field transformations
    await page.selectOption('[data-testid="name-transformation"]', 'uppercase');
    await page.selectOption(
      '[data-testid="rating-transformation"]',
      'normalize'
    );
    await page.selectOption('[data-testid="date-transformation"]', 'format');

    // Verify transformations
    await expect(
      page.locator('[data-testid="transformation-preview"]')
    ).toBeVisible();
  });

  test('should maintain data validation rules after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Upload file
    await page.setInputFiles('[data-testid="file-upload-input"]', 'data.csv');

    // Test validation rules
    await page.click('[data-testid="validation-rules-tab"]');
    await expect(
      page.locator('[data-testid="validation-rules"]')
    ).toBeVisible();

    // Test rule configuration
    await page.check('[data-testid="required-fields-rule"]');
    await page.check('[data-testid="data-type-rule"]');
    await page.check('[data-testid="range-validation-rule"]');

    // Verify rules
    await expect(page.locator('[data-testid="rules-applied"]')).toBeVisible();
  });

  test('should maintain import scheduling functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Test scheduled import
    await page.click('[data-testid="schedule-import-button"]');
    await expect(page.locator('[data-testid="schedule-dialog"]')).toBeVisible();

    // Set schedule
    await page.fill('[data-testid="schedule-time"]', '14:30');
    await page.selectOption('[data-testid="schedule-frequency"]', 'daily');
    await page.click('[data-testid="save-schedule-button"]');

    // Verify schedule
    await expect(
      page.locator('[data-testid="schedule-created"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="next-import-time"]')
    ).toBeVisible();
  });

  test('should maintain data synchronization functionality after changes', async ({
    page,
  }) => {
    // Navigate to import page
    await page.goto('/admin/import');

    // Test data sync
    await page.click('[data-testid="sync-button"]');
    await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible();

    // Wait for sync completion
    await page.waitForSelector('[data-testid="sync-complete"]', {
      timeout: 30000,
    });
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible();

    // Verify sync status
    await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-sync-time"]')).toBeVisible();
  });
});
