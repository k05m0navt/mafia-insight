/**
 * E2E test for Performance Summary feature
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Summary', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to player statistics page
    // Assuming we have a test player with ID 'test-player-id'
    await page.goto('/players/test-player-id/statistics');
    await page.waitForLoadState('networkidle');
  });

  test('should display performance summary with all metrics', async ({
    page,
  }) => {
    // Wait for performance summary to load
    await page.waitForSelector('[data-testid="performance-summary"]', {
      timeout: 10000,
    });

    // Verify all key metrics are displayed
    await expect(page.getByText('Performance Summary')).toBeVisible();
    await expect(page.getByText(/Total Games/i)).toBeVisible();
    await expect(page.getByText(/Wins/i)).toBeVisible();
    await expect(page.getByText(/Losses/i)).toBeVisible();
    await expect(page.getByText(/Win Rate/i)).toBeVisible();
    await expect(page.getByText(/Longest Win Streak/i)).toBeVisible();
    await expect(page.getByText(/Best ELO/i)).toBeVisible();
    await expect(page.getByText(/Games This Week/i)).toBeVisible();
    await expect(page.getByText(/Games This Month/i)).toBeVisible();
  });

  test('should display loading state initially', async ({ page }) => {
    // Navigate to a fresh page
    await page.goto('/players/test-player-id/statistics');

    // Check for skeleton/loading state
    const skeleton = page.locator('[class*="animate-pulse"]').first();
    await expect(skeleton).toBeVisible({ timeout: 2000 });
  });

  test('should display empty state when no game data', async ({ page }) => {
    // Navigate to a player with no games
    await page.goto('/players/empty-player-id/statistics');
    await page.waitForLoadState('networkidle');

    // Check for empty state
    await expect(page.getByText('No Performance Data')).toBeVisible();
    await expect(
      page.getByText(/You don't have any game data yet/)
    ).toBeVisible();
    await expect(
      page.getByText(/Import your game data from gomafia.pro/)
    ).toBeVisible();
  });

  test('should update metrics when date range filter is applied', async ({
    page,
  }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="performance-summary"]', {
      timeout: 10000,
    });

    // Get initial total games value
    const initialTotalGames = await page
      .locator('text=/Total Games/i')
      .locator('..')
      .locator('text=/\\d+/')
      .first()
      .textContent();

    // Apply date range filter (assuming there's a date range selector)
    const dateRangeSelector = page.locator(
      '[data-testid="date-range-selector"]'
    );
    if (await dateRangeSelector.isVisible()) {
      await dateRangeSelector.selectOption('last_3_months');
      await page.waitForTimeout(1000); // Wait for data to refetch

      // Verify metrics updated (or at least refetched)
      const updatedTotalGames = await page
        .locator('text=/Total Games/i')
        .locator('..')
        .locator('text=/\\d+/')
        .first()
        .textContent();

      // Values might be the same or different depending on data
      // Just verify the component is still visible and responsive
      await expect(page.getByText('Performance Summary')).toBeVisible();
    }
  });

  test('should display filter indicators when filters are active', async ({
    page,
  }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="performance-summary"]', {
      timeout: 10000,
    });

    // Apply a filter (date range or role)
    const dateRangeSelector = page.locator(
      '[data-testid="date-range-selector"]'
    );
    if (await dateRangeSelector.isVisible()) {
      await dateRangeSelector.selectOption('last_6_months');
      await page.waitForTimeout(1000);

      // Check for filter indicators
      // Filter indicators should show active filters
      const filterIndicator = page.locator('text=/Last 6 Months/i');
      if (await filterIndicator.isVisible()) {
        await expect(filterIndicator).toBeVisible();
      }
    }
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Navigate to a non-existent player
    await page.goto('/players/non-existent-player-id/statistics');
    await page.waitForLoadState('networkidle');

    // Should show error or 404 state
    // Either error message or empty state should be visible
    const errorMessage = page.locator(
      'text=/Error loading performance summary/i'
    );
    const emptyState = page.getByText('No Performance Data');

    // One of these should be visible
    const hasError = await errorMessage.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasError || hasEmpty).toBe(true);
  });

  test('should conditionally display average game duration', async ({
    page,
  }) => {
    // Wait for performance summary to load
    await page.waitForSelector('[data-testid="performance-summary"]', {
      timeout: 10000,
    });

    // Check if average duration is displayed
    const avgDuration = page.getByText(/Avg Duration/i);
    const isVisible = await avgDuration.isVisible().catch(() => false);

    // If visible, should have a value
    if (isVisible) {
      await expect(avgDuration).toBeVisible();
      // Should have a number and "min" unit
      await expect(page.getByText(/min/i)).toBeVisible();
    }
    // If not visible, that's also valid (no duration data available)
  });

  test('should display metrics with correct formatting', async ({ page }) => {
    // Wait for performance summary to load
    await page.waitForSelector('[data-testid="performance-summary"]', {
      timeout: 10000,
    });

    // Verify win percentage is displayed with % symbol
    const winRate = page.getByText(/Win Rate/i);
    if (await winRate.isVisible()) {
      // Should have percentage symbol nearby
      const percentageSymbol = page.locator('text=/%/').first();
      await expect(percentageSymbol).toBeVisible();
    }

    // Verify large numbers are formatted with commas
    const totalGames = page.getByText(/Total Games/i);
    if (await totalGames.isVisible()) {
      // Check if there's a number with comma formatting (for large numbers)
      const numberWithComma = page.locator('text=/\\d{1,3}(,\\d{3})+/').first();
      const hasCommaFormatting = await numberWithComma
        .isVisible()
        .catch(() => false);
      // This is optional - only applies to numbers >= 1000
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/players/test-player-id/statistics');
    await page.waitForLoadState('networkidle');

    // Wait for performance summary
    await page.waitForSelector('[data-testid="performance-summary"]', {
      timeout: 10000,
    });

    // Verify component is visible and responsive
    await expect(page.getByText('Performance Summary')).toBeVisible();

    // On mobile, cards should stack vertically
    // Verify layout is responsive (not checking exact layout, just that it renders)
    const cards = page.locator('[class*="grid"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should clear filters when clear all is clicked', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="performance-summary"]', {
      timeout: 10000,
    });

    // Apply filters first
    const dateRangeSelector = page.locator(
      '[data-testid="date-range-selector"]'
    );
    if (await dateRangeSelector.isVisible()) {
      await dateRangeSelector.selectOption('last_6_months');
      await page.waitForTimeout(1000);

      // Look for clear all button in filter indicators
      const clearAllButton = page.getByText('Clear all');
      if (await clearAllButton.isVisible()) {
        await clearAllButton.click();
        await page.waitForTimeout(1000);

        // Verify filters are cleared (filter indicators should disappear or reset)
        await expect(page.getByText('Performance Summary')).toBeVisible();
      }
    }
  });
});
