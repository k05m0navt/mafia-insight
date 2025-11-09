/**
 * E2E Test: Validation Rate Display (T098)
 *
 * Verifies that the validation rate is displayed correctly in the UI
 * and shows ≥98% threshold status appropriately.
 *
 * @requires Playwright environment with running app
 */

import { test, expect } from '@playwright/test';

test.describe('Import Validation Rate Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import page
    await page.goto('/admin/import');
  });

  test('should display validation rate after import completion', async ({
    page,
  }) => {
    // Wait for import status to load
    await page.waitForSelector('[data-testid="validation-summary"]', {
      timeout: 10000,
    });

    // Check for validation rate display
    const validationRateElement = page.locator(
      '[data-testid="validation-rate"]'
    );
    await expect(validationRateElement).toBeVisible();

    // Validation rate should be a percentage
    const rateText = await validationRateElement.textContent();
    expect(rateText).toMatch(/\d+(\.\d+)?%/);
  });

  test('should show "Excellent" badge when validation rate ≥98%', async ({
    page,
  }) => {
    // Wait for validation summary card
    await page.waitForSelector('[data-testid="validation-summary"]', {
      timeout: 10000,
    });

    // Get validation rate
    const validationRateText = await page
      .locator('[data-testid="validation-rate"]')
      .textContent();
    const validationRate = parseFloat(
      validationRateText?.replace('%', '') || '0'
    );

    if (validationRate >= 98) {
      // Should show Excellent badge
      await expect(page.locator('text=Excellent')).toBeVisible();

      // Should not show warning message
      await expect(
        page.locator('text=/Warning.*below.*98%/')
      ).not.toBeVisible();
    }
  });

  test('should show warning when validation rate <98%', async ({ page }) => {
    // Wait for validation summary card
    await page.waitForSelector('[data-testid="validation-summary"]', {
      timeout: 10000,
    });

    // Get validation rate
    const validationRateText = await page
      .locator('[data-testid="validation-rate"]')
      .textContent();
    const validationRate = parseFloat(
      validationRateText?.replace('%', '') || '0'
    );

    if (validationRate < 98) {
      // Should show warning
      await expect(page.locator('text=/Warning.*below.*98%/')).toBeVisible();

      // Should show appropriate badge
      const badge = page.locator('[data-testid="validation-status-badge"]');
      const badgeText = await badge.textContent();
      expect(['Good', 'Below Threshold']).toContain(badgeText);
    }
  });

  test('should display total processed records', async ({ page }) => {
    await page.waitForSelector('[data-testid="validation-summary"]', {
      timeout: 10000,
    });

    const totalProcessed = page
      .locator('text=/Total Processed/i')
      .locator('..')
      .locator('span.font-bold');
    await expect(totalProcessed).toBeVisible();

    const totalText = await totalProcessed.textContent();
    expect(totalText).toMatch(/\d+(,\d+)*/); // Should be a formatted number
  });

  test('should display valid and invalid record counts', async ({ page }) => {
    await page.waitForSelector('[data-testid="validation-summary"]', {
      timeout: 10000,
    });

    // Check valid records (should be green)
    const validRecords = page
      .locator('text=/Valid Records/i')
      .locator('..')
      .locator('.text-green-600');
    await expect(validRecords).toBeVisible();

    // Check invalid records (should be red)
    const invalidRecords = page
      .locator('text=/Invalid Records/i')
      .locator('..')
      .locator('.text-red-600');
    await expect(invalidRecords).toBeVisible();
  });

  test('should update validation metrics after import completion', async ({
    page,
  }) => {
    // Trigger import
    await page.click('button:has-text("Start Import")');

    // Wait for import to complete (with timeout)
    await page.waitForSelector('text=/Import.*complete/i', { timeout: 300000 }); // 5 minutes

    // Validation summary should appear
    await expect(
      page.locator('[data-testid="validation-summary"]')
    ).toBeVisible();

    // Validation rate should be displayed
    const validationRate = page.locator('[data-testid="validation-rate"]');
    await expect(validationRate).toBeVisible();

    const rateText = await validationRate.textContent();
    const rate = parseFloat(rateText?.replace('%', '') || '0');

    // Rate should be between 0 and 100
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });
});
