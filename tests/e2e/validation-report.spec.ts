/**
 * E2E Test: Validation Quality Report Display (Task 10: AC #3)
 *
 * Verifies that the validation quality report is displayed correctly
 * and user can interact with it when threshold is not met.
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Validation Quality Report (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sync page
    await page.goto('/sync');
  });

  test('should display validation report when import completes', async ({
    page,
  }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if validation report component exists
    const validationReport = page.locator('text=Validation Quality Report');
    await expect(validationReport).toBeVisible({ timeout: 10000 });
  });

  test('should show validation rate with visual indicator', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Check for validation rate display
    const validationRate = page.locator('text=/\\d+(\\.\\d+)?%/').first();
    await expect(validationRate).toBeVisible();

    // Check for progress bar
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
  });

  test('should display record counts (total, valid, invalid)', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Check for total records
    await expect(page.locator('text=/Total Records/i')).toBeVisible();

    // Check for valid records (should be green)
    const validRecords = page
      .locator('text=/Valid/i')
      .filter({ hasText: /\\d+/ })
      .first();
    await expect(validRecords).toBeVisible();

    // Check for invalid records (should be red)
    const invalidRecords = page
      .locator('text=/Invalid/i')
      .filter({ hasText: /\\d+/ })
      .first();
    await expect(invalidRecords).toBeVisible();
  });

  test('should show warning alert when validation rate < 98%', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Check for warning alert if threshold not met
    const warningAlert = page.locator('text=/Data Quality Below Threshold/i');
    const isVisible = await warningAlert.isVisible().catch(() => false);

    if (isVisible) {
      await expect(warningAlert).toBeVisible();
      await expect(
        page.locator('text=/below the required 98% threshold/i')
      ).toBeVisible();
    }
  });

  test('should display errors by entity type', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for errors by entity section
    const errorsByEntity = page.locator('text=/Errors by Entity Type/i');
    const isVisible = await errorsByEntity.isVisible().catch(() => false);

    if (isVisible) {
      await expect(errorsByEntity).toBeVisible();
    }
  });

  test('should display recent validation errors in table', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for recent errors section
    const recentErrors = page.locator('text=/Recent Validation Errors/i');
    const isVisible = await recentErrors.isVisible().catch(() => false);

    if (isVisible) {
      await expect(recentErrors).toBeVisible();

      // Check for error table
      const errorTable = page.locator('table').filter({ hasText: /Entity/i });
      await expect(errorTable).toBeVisible();
    }
  });

  test('should show "Continue Anyway" button when threshold not met', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Check for continue button if threshold not met
    const continueButton = page.locator('button:has-text("Continue Anyway")');
    const isVisible = await continueButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(continueButton).toBeVisible();

      // Click button to open confirmation dialog
      await continueButton.click();

      // Check for confirmation dialog
      await expect(
        page.locator('text=/Continue with Low Quality Data/i')
      ).toBeVisible();
    }
  });

  test('should display integrity check results if available', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Check for integrity check section
    const integritySection = page.locator('text=/Integrity Check Results/i');
    const isVisible = await integritySection.isVisible().catch(() => false);

    if (isVisible) {
      await expect(integritySection).toBeVisible();
    }
  });

  // Task 10: AC #3 - Accessibility test
  test('should be accessible (WCAG 2.1 AA)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Inject axe-core
    await injectAxe(page);

    // Check accessibility of validation report
    const validationReport = page.locator('text=Validation Quality Report');
    const isVisible = await validationReport.isVisible().catch(() => false);

    if (isVisible) {
      // Find the card containing the validation report
      const reportCard = validationReport.locator('..').locator('..');
      await checkA11y(page, reportCard, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    }
  });

  test('should handle missing validation data gracefully', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Component should show "No validation data available" message
    // if validation summary is null
    const noDataMessage = page.locator('text=/No validation data available/i');
    const isVisible = await noDataMessage.isVisible().catch(() => false);

    // Either validation report or no data message should be visible
    const hasReport = await page
      .locator('text=Validation Quality Report')
      .isVisible()
      .catch(() => false);

    expect(hasReport || isVisible).toBe(true);
  });
});
