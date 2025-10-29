import { test, expect } from '@playwright/test';

test.describe('Analytics - Tournaments', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tournaments page
    await page.goto('/tournaments');
  });

  test('should display tournaments list with search functionality', async ({
    page,
  }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if tournaments list is visible
    await expect(
      page.locator('[data-testid="tournaments-list"]')
    ).toBeVisible();

    // Test search functionality
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Wait for search to process

    // Verify search results
    const tournamentCards = page.locator('[data-testid="tournament-card"]');
    await expect(tournamentCards).toHaveCountGreaterThan(0);
  });

  test('should navigate to tournament analytics page', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on first tournament card
    const firstTournamentCard = page
      .locator('[data-testid="tournament-card"]')
      .first();
    await firstTournamentCard.click();

    // Should navigate to tournament analytics page
    await expect(page).toHaveURL(/\/tournaments\/[^\/]+$/);
    await expect(page.locator('h1')).toContainText('Tournament Analytics');
  });

  test('should display tournament analytics with participant statistics', async ({
    page,
  }) => {
    // Navigate to a specific tournament's analytics page
    await page.goto('/tournaments/test-tournament-1');
    await page.waitForLoadState('networkidle');

    // Check if analytics components are visible
    await expect(
      page.locator('[data-testid="tournament-stats"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="participant-list"]')
    ).toBeVisible();

    // Check for key tournament metrics
    await expect(
      page.locator('[data-testid="participant-count"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="total-games"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="tournament-status"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="prize-pool"]')).toBeVisible();
  });

  test('should display tournament standings', async ({ page }) => {
    await page.goto('/tournaments/test-tournament-1');
    await page.waitForLoadState('networkidle');

    // Check for standings table
    await expect(page.locator('[data-testid="standings-table"]')).toBeVisible();

    // Verify standings data is displayed
    const standingRows = page.locator('[data-testid="standing-row"]');
    await expect(standingRows).toHaveCountGreaterThan(0);

    // Check for key columns
    await expect(page.locator('th:has-text("Rank")')).toBeVisible();
    await expect(page.locator('th:has-text("Player")')).toBeVisible();
    await expect(page.locator('th:has-text("Points")')).toBeVisible();
    await expect(page.locator('th:has-text("Games")')).toBeVisible();
  });

  test('should display tournament bracket if available', async ({ page }) => {
    await page.goto('/tournaments/test-tournament-1');
    await page.waitForLoadState('networkidle');

    // Check for bracket visualization
    const bracketSection = page.locator('[data-testid="tournament-bracket"]');
    if (await bracketSection.isVisible()) {
      await expect(bracketSection).toBeVisible();

      // Verify bracket rounds are displayed
      const bracketRounds = page.locator('[data-testid="bracket-round"]');
      await expect(bracketRounds).toHaveCountGreaterThan(0);
    }
  });

  test('should display tournament games history', async ({ page }) => {
    await page.goto('/tournaments/test-tournament-1');
    await page.waitForLoadState('networkidle');

    // Check for games history section
    await expect(page.locator('[data-testid="games-history"]')).toBeVisible();

    // Verify game entries are displayed
    const gameEntries = page.locator('[data-testid="game-entry"]');
    await expect(gameEntries).toHaveCountGreaterThan(0);
  });

  test('should handle empty state when no tournaments found', async ({
    page,
  }) => {
    // Search for non-existent tournament
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('nonexistenttournament12345');
    await page.waitForTimeout(500);

    // Should show empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No tournaments found')).toBeVisible();
  });

  test('should filter tournaments by status', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Test status filter
    const statusFilter = page.locator('[data-testid="status-filter"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('active');
      await page.waitForTimeout(500);

      // Verify filtered results
      const tournamentCards = page.locator('[data-testid="tournament-card"]');
      await expect(tournamentCards).toHaveCountGreaterThan(0);
    }
  });

  test('should filter tournaments by date range', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Test date range filter
    const dateFilter = page.locator('[data-testid="date-filter"]');
    if (await dateFilter.isVisible()) {
      await dateFilter.selectOption('last-month');
      await page.waitForTimeout(500);

      // Verify filtered results
      const tournamentCards = page.locator('[data-testid="tournament-card"]');
      await expect(tournamentCards).toHaveCountGreaterThan(0);
    }
  });

  test('should display tournament prize distribution', async ({ page }) => {
    await page.goto('/tournaments/test-tournament-1');
    await page.waitForLoadState('networkidle');

    // Check for prize distribution section
    const prizeSection = page.locator('[data-testid="prize-distribution"]');
    if (await prizeSection.isVisible()) {
      await expect(prizeSection).toBeVisible();

      // Verify prize tiers are displayed
      const prizeTiers = page.locator('[data-testid="prize-tier"]');
      await expect(prizeTiers).toHaveCountGreaterThan(0);
    }
  });
});
