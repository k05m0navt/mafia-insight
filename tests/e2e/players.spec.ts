import { test, expect } from '@playwright/test';

test.describe('Players Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/players**', async (route) => {
      const url = new URL(route.request().url());
      const pageParam = url.searchParams.get('page') || '1';
      const limitParam = url.searchParams.get('limit') || '10';

      const mockPlayers = Array.from(
        { length: parseInt(limitParam) },
        (_, i) => ({
          id: `player${i + 1}`,
          gomafiaId: `gomafia${i + 1}`,
          name: `Player ${i + 1}`,
          eloRating: 1500 + i * 10,
          totalGames: 100 + i,
          wins: 60 + i,
          losses: 40 + i,
          lastSyncAt: new Date('2024-01-15T00:00:00Z').toISOString(),
          syncStatus: 'SYNCED',
        })
      );

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          players: mockPlayers,
          pagination: {
            page: parseInt(pageParam),
            limit: parseInt(limitParam),
            total: 100,
            totalPages: 10,
            hasNext: parseInt(pageParam) < 10,
            hasPrev: parseInt(pageParam) > 1,
          },
        }),
      });
    });
  });

  test('should display players list with pagination', async ({ page }) => {
    await page.goto('/players');

    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Players');

    // Check that players are displayed
    await expect(page.locator('[data-testid="player-card"]')).toHaveCount(10);

    // Check pagination
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="pagination-info"]')).toContainText(
      'Page 1 of 10'
    );
  });

  test('should handle pagination navigation', async ({ page }) => {
    await page.goto('/players');

    // Click next page
    await page.click('[data-testid="pagination-next"]');

    // Wait for new data to load
    await expect(page.locator('[data-testid="pagination-info"]')).toContainText(
      'Page 2 of 10'
    );

    // Click previous page
    await page.click('[data-testid="pagination-prev"]');

    // Wait for data to load
    await expect(page.locator('[data-testid="pagination-info"]')).toContainText(
      'Page 1 of 10'
    );
  });

  test('should handle filtering by sync status', async ({ page }) => {
    await page.goto('/players');

    // Open filter dropdown
    await page.click('[data-testid="filter-button"]');

    // Select sync status filter
    await page.selectOption('[data-testid="sync-status-filter"]', 'SYNCED');

    // Apply filter
    await page.click('[data-testid="apply-filters"]');

    // Wait for filtered results
    await expect(page.locator('[data-testid="player-card"]')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/players');

    // Type in search box
    await page.fill('[data-testid="search-input"]', 'Player 1');

    // Click search button
    await page.click('[data-testid="search-button"]');

    // Wait for search results
    await expect(page.locator('[data-testid="player-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="player-card"]')).toContainText(
      'Player 1'
    );
  });

  test('should handle sorting by different fields', async ({ page }) => {
    await page.goto('/players');

    // Open sort dropdown
    await page.click('[data-testid="sort-button"]');

    // Select ELO rating sort
    await page.selectOption('[data-testid="sort-field"]', 'eloRating');
    await page.selectOption('[data-testid="sort-order"]', 'desc');

    // Apply sort
    await page.click('[data-testid="apply-sort"]');

    // Wait for sorted results
    await expect(page.locator('[data-testid="player-card"]')).toBeVisible();
  });

  test('should display player details when clicked', async ({ page }) => {
    await page.goto('/players');

    // Click on first player
    await page.click('[data-testid="player-card"]:first-child');

    // Wait for navigation to player details
    await expect(page).toHaveURL(/\/players\/player1/);
    await expect(page.locator('h1')).toContainText('Player 1');
  });

  test('should handle loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/players**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          players: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        }),
      });
    });

    await page.goto('/players');

    // Check loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

    // Wait for loading to complete
    await expect(
      page.locator('[data-testid="loading-spinner"]')
    ).not.toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/players**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/players');

    // Check error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Failed to load players'
    );
  });

  test('should handle empty results', async ({ page }) => {
    // Mock empty API response
    await page.route('**/api/players**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          players: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        }),
      });
    });

    await page.goto('/players');

    // Check empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state"]')).toContainText(
      'No players found'
    );
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/players');

    // Check that mobile layout is applied
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/players');

    // Check that tablet layout is applied
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/players');

    // Check that desktop layout is applied
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/players');

    // Focus on search input
    await page.focus('[data-testid="search-input"]');

    // Type search term
    await page.keyboard.type('Player');

    // Press Enter to search
    await page.keyboard.press('Enter');

    // Wait for search results
    await expect(page.locator('[data-testid="player-card"]')).toBeVisible();

    // Tab to next element
    await page.keyboard.press('Tab');

    // Check that focus is on next element
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should handle accessibility features', async ({ page }) => {
    await page.goto('/players');

    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();

    // Check for proper button labels
    await expect(page.locator('[data-testid="search-button"]')).toHaveAttribute(
      'aria-label'
    );

    // Check for proper form labels
    await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute(
      'aria-label'
    );

    // Check for proper table headers
    await expect(page.locator('[data-testid="player-table"] th')).toHaveCount(
      6
    ); // ID, Name, ELO, Games, Wins, Losses

    // Check for proper pagination labels
    await expect(page.locator('[data-testid="pagination"]')).toHaveAttribute(
      'aria-label'
    );
  });
});
