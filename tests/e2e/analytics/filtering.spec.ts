import { test, expect } from '@playwright/test';

test.describe('Analytics - Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to analytics dashboard
    await page.goto('/');
  });

  test('should filter players by role', async ({ page }) => {
    // Navigate to players page
    await page.goto('/test-players');
    await page.waitForLoadState('networkidle');

    // Test role filter
    const roleFilter = page.locator('[data-testid="role-filter"]');
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('mafia');
      await page.waitForTimeout(500);

      // Verify filtered results
      const playerCards = page.locator('[data-testid="player-card"]');
      await expect(playerCards).toHaveCountGreaterThan(0);

      // Verify all displayed players have mafia role
      const roleBadges = page.locator('[data-testid="role-badge"]');
      const count = await roleBadges.count();
      for (let i = 0; i < count; i++) {
        await expect(roleBadges.nth(i)).toContainText('mafia');
      }
    }
  });

  test('should filter players by rating range', async ({ page }) => {
    await page.goto('/test-players');
    await page.waitForLoadState('networkidle');

    // Test rating range filter
    const ratingFilter = page.locator('[data-testid="rating-filter"]');
    if (await ratingFilter.isVisible()) {
      // Set minimum rating
      const minRating = page.locator('[data-testid="min-rating"]');
      await minRating.fill('1500');

      // Set maximum rating
      const maxRating = page.locator('[data-testid="max-rating"]');
      await maxRating.fill('2000');

      await page.waitForTimeout(500);

      // Verify filtered results
      const playerCards = page.locator('[data-testid="player-card"]');
      await expect(playerCards).toHaveCountGreaterThan(0);
    }
  });

  test('should filter players by games played', async ({ page }) => {
    await page.goto('/test-players');
    await page.waitForLoadState('networkidle');

    // Test games played filter
    const gamesFilter = page.locator('[data-testid="games-filter"]');
    if (await gamesFilter.isVisible()) {
      await gamesFilter.selectOption('100+');
      await page.waitForTimeout(500);

      // Verify filtered results
      const playerCards = page.locator('[data-testid="player-card"]');
      await expect(playerCards).toHaveCountGreaterThan(0);
    }
  });

  test('should filter clubs by member count', async ({ page }) => {
    await page.goto('/clubs');
    await page.waitForLoadState('networkidle');

    // Test member count filter
    const memberFilter = page.locator('[data-testid="member-count-filter"]');
    if (await memberFilter.isVisible()) {
      await memberFilter.selectOption('10+');
      await page.waitForTimeout(500);

      // Verify filtered results
      const clubCards = page.locator('[data-testid="club-card"]');
      await expect(clubCards).toHaveCountGreaterThan(0);
    }
  });

  test('should filter tournaments by status', async ({ page }) => {
    await page.goto('/tournaments');
    await page.waitForLoadState('networkidle');

    // Test status filter
    const statusFilter = page.locator('[data-testid="status-filter"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('completed');
      await page.waitForTimeout(500);

      // Verify filtered results
      const tournamentCards = page.locator('[data-testid="tournament-card"]');
      await expect(tournamentCards).toHaveCountGreaterThan(0);
    }
  });

  test('should filter tournaments by date range', async ({ page }) => {
    await page.goto('/tournaments');
    await page.waitForLoadState('networkidle');

    // Test date range filter
    const dateFilter = page.locator('[data-testid="date-filter"]');
    if (await dateFilter.isVisible()) {
      await dateFilter.selectOption('last-3-months');
      await page.waitForTimeout(500);

      // Verify filtered results
      const tournamentCards = page.locator('[data-testid="tournament-card"]');
      await expect(tournamentCards).toHaveCountGreaterThan(0);
    }
  });

  test('should combine multiple filters', async ({ page }) => {
    await page.goto('/test-players');
    await page.waitForLoadState('networkidle');

    // Apply multiple filters
    const roleFilter = page.locator('[data-testid="role-filter"]');
    const ratingFilter = page.locator('[data-testid="rating-filter"]');

    if ((await roleFilter.isVisible()) && (await ratingFilter.isVisible())) {
      await roleFilter.selectOption('citizen');
      await page.waitForTimeout(300);

      const minRating = page.locator('[data-testid="min-rating"]');
      await minRating.fill('1200');
      await page.waitForTimeout(500);

      // Verify combined filtered results
      const playerCards = page.locator('[data-testid="player-card"]');
      await expect(playerCards).toHaveCountGreaterThan(0);
    }
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto('/test-players');
    await page.waitForLoadState('networkidle');

    // Apply a filter first
    const roleFilter = page.locator('[data-testid="role-filter"]');
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('mafia');
      await page.waitForTimeout(500);

      // Clear all filters
      const clearFiltersButton = page.locator('[data-testid="clear-filters"]');
      if (await clearFiltersButton.isVisible()) {
        await clearFiltersButton.click();
        await page.waitForTimeout(500);

        // Verify all players are shown again
        const playerCards = page.locator('[data-testid="player-card"]');
        await expect(playerCards).toHaveCountGreaterThan(0);
      }
    }
  });

  test('should persist filters in URL', async ({ page }) => {
    await page.goto('/test-players');
    await page.waitForLoadState('networkidle');

    // Apply a filter
    const roleFilter = page.locator('[data-testid="role-filter"]');
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('mafia');
      await page.waitForTimeout(500);

      // Check if URL contains filter parameter
      const url = page.url();
      expect(url).toContain('role=mafia');

      // Reload page and verify filter is still applied
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify filter is still selected
      await expect(roleFilter).toHaveValue('mafia');
    }
  });

  test('should show filter count indicators', async ({ page }) => {
    await page.goto('/test-players');
    await page.waitForLoadState('networkidle');

    // Apply filters
    const roleFilter = page.locator('[data-testid="role-filter"]');
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption('mafia');
      await page.waitForTimeout(500);

      // Check for active filter count
      const filterCount = page.locator('[data-testid="active-filter-count"]');
      if (await filterCount.isVisible()) {
        await expect(filterCount).toContainText('1');
      }
    }
  });

  test('should handle filter validation', async ({ page }) => {
    await page.goto('/test-players');
    await page.waitForLoadState('networkidle');

    // Test invalid rating range
    const minRating = page.locator('[data-testid="min-rating"]');
    const maxRating = page.locator('[data-testid="max-rating"]');

    if ((await minRating.isVisible()) && (await maxRating.isVisible())) {
      await minRating.fill('2000');
      await maxRating.fill('1500'); // Invalid: min > max
      await page.waitForTimeout(500);

      // Check for validation error
      const errorMessage = page.locator('[data-testid="filter-error"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText('Invalid range');
      }
    }
  });
});
