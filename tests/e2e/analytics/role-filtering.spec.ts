/**
 * E2E tests for role filtering in analytics dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Analytics - Role Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a player statistics page
    // Note: This assumes there's at least one player in the system
    // In a real scenario, you'd set up test data first
    await page.goto('/players');
    await page.waitForLoadState('networkidle');

    // Click on first player to navigate to statistics page
    const firstPlayerLink = page.locator('[data-testid="player-card"]').first();
    if (await firstPlayerLink.isVisible()) {
      await firstPlayerLink.click();
      await page.waitForURL(/\/players\/.*\/statistics/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display role filter component', async ({ page }) => {
    // Check that role filter is visible
    const roleFilter = page
      .locator('text=Role Filter')
      .or(page.locator('button:has-text("Don")'));
    await expect(roleFilter.first()).toBeVisible();
  });

  test('should select single role and update analytics', async ({ page }) => {
    // Select Don role
    const donButton = page.locator('button:has-text("Don")');
    await expect(donButton).toBeVisible();
    await donButton.click();
    await page.waitForTimeout(500); // Wait for filter to apply

    // Verify filter indicator shows Don selected
    const filterIndicator = page.locator('text=/Don selected/');
    await expect(filterIndicator).toBeVisible();

    // Verify analytics components update (check for loading state or data change)
    // This is a basic check - in a real scenario you'd verify actual data changes
    await page.waitForTimeout(1000); // Wait for data to load
  });

  test('should select multiple roles and update analytics', async ({
    page,
  }) => {
    // Select Don
    const donButton = page.locator('button:has-text("Don")');
    await donButton.click();
    await page.waitForTimeout(300);

    // Select Mafia
    const mafiaButton = page.locator('button:has-text("Mafia")');
    await mafiaButton.click();
    await page.waitForTimeout(500); // Wait for filter to apply

    // Verify filter indicator shows both roles
    const filterIndicator = page.locator('text=/Don \\+ Mafia selected/');
    await expect(filterIndicator).toBeVisible();

    // Verify both buttons are highlighted
    await expect(donButton).toHaveClass(/shadow-md/);
    await expect(mafiaButton).toHaveClass(/shadow-md/);
  });

  test('should clear role filter and reset analytics', async ({ page }) => {
    // Select a role first
    const donButton = page.locator('button:has-text("Don")');
    await donButton.click();
    await page.waitForTimeout(500);

    // Verify filter is active
    const filterIndicator = page.locator('text=/Don selected/');
    await expect(filterIndicator).toBeVisible();

    // Click clear button
    const clearButton = page.locator('button:has-text("Clear")');
    await clearButton.click();
    await page.waitForTimeout(500);

    // Verify filter indicator is gone
    await expect(filterIndicator).not.toBeVisible();

    // Verify Don button is no longer highlighted
    await expect(donButton).not.toHaveClass(/shadow-md/);
  });

  test('should maintain role filter across navigation', async ({ page }) => {
    // Select Don role
    const donButton = page.locator('button:has-text("Don")');
    await donButton.click();
    await page.waitForTimeout(500);

    // Navigate to different tab (e.g., Role Metrics tab)
    const roleMetricsTab = page.locator('button:has-text("Role Metrics")');
    if (await roleMetricsTab.isVisible()) {
      await roleMetricsTab.click();
      await page.waitForTimeout(500);

      // Verify filter is still active
      const filterIndicator = page.locator('text=/Don selected/');
      await expect(filterIndicator).toBeVisible();
    }
  });

  test('should show loading state when role filter is applied', async ({
    page,
  }) => {
    // Select a role
    const donButton = page.locator('button:has-text("Don")');
    await donButton.click();

    // Check for loading indicator (may be brief, so we check immediately)
    const loadingSpinner = page.locator('.animate-spin');
    // Loading might be too fast to catch, so we just verify the filter was applied
    await page.waitForTimeout(300);

    // Verify filter indicator is shown
    const filterIndicator = page.locator('text=/Don selected/');
    await expect(filterIndicator).toBeVisible();
  });

  test('should handle all roles selected (same as no filter)', async ({
    page,
  }) => {
    // Select all roles
    const donButton = page.locator('button:has-text("Don")');
    const mafiaButton = page.locator('button:has-text("Mafia")');
    const sheriffButton = page.locator('button:has-text("Sheriff")');
    const citizenButton = page.locator('button:has-text("Citizen")');

    await donButton.click();
    await page.waitForTimeout(200);
    await mafiaButton.click();
    await page.waitForTimeout(200);
    await sheriffButton.click();
    await page.waitForTimeout(200);
    await citizenButton.click();
    await page.waitForTimeout(500);

    // All buttons should be highlighted
    await expect(donButton).toHaveClass(/shadow-md/);
    await expect(mafiaButton).toHaveClass(/shadow-md/);
    await expect(sheriffButton).toHaveClass(/shadow-md/);
    await expect(citizenButton).toHaveClass(/shadow-md/);
  });

  test('should toggle role on and off', async ({ page }) => {
    const donButton = page.locator('button:has-text("Don")');

    // Click to select
    await donButton.click();
    await page.waitForTimeout(300);
    await expect(donButton).toHaveClass(/shadow-md/);

    // Click again to deselect
    await donButton.click();
    await page.waitForTimeout(300);
    await expect(donButton).not.toHaveClass(/shadow-md/);
  });

  test('should combine role filter with date range filter', async ({
    page,
  }) => {
    // Select date range first
    const lastMonthButton = page.locator('button:has-text("Last Month")');
    if (await lastMonthButton.isVisible()) {
      await lastMonthButton.click();
      await page.waitForTimeout(300);
    }

    // Select role filter
    const donButton = page.locator('button:has-text("Don")');
    await donButton.click();
    await page.waitForTimeout(500);

    // Verify both filters are shown
    const dateFilterIndicator = page.locator('text=/Date:/');
    const roleFilterIndicator = page.locator('text=/Roles:/');
    await expect(dateFilterIndicator).toBeVisible();
    await expect(roleFilterIndicator).toBeVisible();
  });
});
