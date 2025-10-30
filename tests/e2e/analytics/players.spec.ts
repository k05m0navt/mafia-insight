import { test, expect } from '@playwright/test';

test.describe('Analytics - Players', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to players page
    await page.goto('/test-players');
  });

  test('should display players list with search functionality', async ({
    page,
  }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if players list is visible
    await expect(page.locator('[data-testid="players-list"]')).toBeVisible();

    // Test search functionality
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Wait for search to process

    // Verify search results
    const playerCards = page.locator('[data-testid="player-card"]');
    await expect(playerCards).toHaveCountGreaterThan(0);
  });

  test('should navigate to player statistics page', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on first player card
    const firstPlayerCard = page.locator('[data-testid="player-card"]').first();
    await firstPlayerCard.click();

    // Should navigate to player statistics page
    await expect(page).toHaveURL(/\/test-players\/[^\/]+\/statistics/);
    await expect(page.locator('h1')).toContainText('Player Statistics');
  });

  test('should display player analytics with role filtering', async ({
    page,
  }) => {
    // Navigate to a specific player's analytics page
    await page.goto('/test-players/test-player-1/statistics');
    await page.waitForLoadState('networkidle');

    // Check if analytics components are visible
    await expect(
      page.locator('[data-testid="player-statistics"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="tournament-history"]')
    ).toBeVisible();

    // Test role filtering
    const roleFilter = page.locator('[data-testid="role-filter"]');
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('mafia');
      await page.waitForTimeout(500);

      // Verify role-specific data is displayed
      await expect(page.locator('[data-testid="role-stats"]')).toBeVisible();
    }
  });

  test('should handle empty state when no players found', async ({ page }) => {
    // Search for non-existent player
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('nonexistentplayer12345');
    await page.waitForTimeout(500);

    // Should show empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No players found')).toBeVisible();
  });

  test('should display player performance metrics', async ({ page }) => {
    await page.goto('/test-players/test-player-1/statistics');
    await page.waitForLoadState('networkidle');

    // Check for key performance metrics
    await expect(page.locator('[data-testid="elo-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="win-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-games"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="performance-trend"]')
    ).toBeVisible();
  });

  test('should handle year filtering', async ({ page }) => {
    await page.goto('/test-players/test-player-1/statistics');
    await page.waitForLoadState('networkidle');

    // Test year filter
    const yearFilter = page.locator('[data-testid="year-filter"]');
    if (await yearFilter.isVisible()) {
      await yearFilter.selectOption('2024');
      await page.waitForTimeout(500);

      // Verify filtered data is displayed
      await expect(
        page.locator('[data-testid="filtered-stats"]')
      ).toBeVisible();
    }
  });
});
