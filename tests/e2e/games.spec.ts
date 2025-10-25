import { test, expect } from '@playwright/test';

test.describe('Games Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/games**', async (route) => {
      const url = new URL(route.request().url());
      const pageParam = url.searchParams.get('page') || '1';
      const limitParam = url.searchParams.get('limit') || '10';

      const mockGames = Array.from(
        { length: parseInt(limitParam) },
        (_, i) => ({
          id: `game${i + 1}`,
          gomafiaId: `gomafia${i + 1}`,
          date: new Date(`2024-01-${15 + i}T20:00:00Z`).toISOString(),
          durationMinutes: 45 + i,
          winnerTeam: i % 2 === 0 ? 'BLACK' : 'RED',
          status: 'COMPLETED',
          lastSyncAt: new Date('2024-01-15T00:00:00Z').toISOString(),
          syncStatus: 'SYNCED',
        })
      );

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          games: mockGames,
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

  test('should display games list with pagination', async ({ page }) => {
    await page.goto('/games');

    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Games');

    // Check that games are displayed
    await expect(page.locator('[data-testid="game-card"]')).toHaveCount(10);

    // Check pagination
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="pagination-info"]')).toContainText(
      'Page 1 of 10'
    );
  });

  test('should handle pagination navigation', async ({ page }) => {
    await page.goto('/games');

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

  test('should handle filtering by status', async ({ page }) => {
    await page.goto('/games');

    // Open filter dropdown
    await page.click('[data-testid="filter-button"]');

    // Select status filter
    await page.selectOption('[data-testid="status-filter"]', 'COMPLETED');

    // Apply filter
    await page.click('[data-testid="apply-filters"]');

    // Wait for filtered results
    await expect(page.locator('[data-testid="game-card"]')).toBeVisible();
  });

  test('should handle filtering by winner team', async ({ page }) => {
    await page.goto('/games');

    // Open filter dropdown
    await page.click('[data-testid="filter-button"]');

    // Select winner team filter
    await page.selectOption('[data-testid="winner-team-filter"]', 'BLACK');

    // Apply filter
    await page.click('[data-testid="apply-filters"]');

    // Wait for filtered results
    await expect(page.locator('[data-testid="game-card"]')).toBeVisible();
  });

  test('should handle filtering by date range', async ({ page }) => {
    await page.goto('/games');

    // Open filter dropdown
    await page.click('[data-testid="filter-button"]');

    // Set date range
    await page.fill('[data-testid="start-date-input"]', '2024-01-01');
    await page.fill('[data-testid="end-date-input"]', '2024-01-31');

    // Apply filter
    await page.click('[data-testid="apply-filters"]');

    // Wait for filtered results
    await expect(page.locator('[data-testid="game-card"]')).toBeVisible();
  });

  test('should handle sorting by different fields', async ({ page }) => {
    await page.goto('/games');

    // Open sort dropdown
    await page.click('[data-testid="sort-button"]');

    // Select duration sort
    await page.selectOption('[data-testid="sort-field"]', 'durationMinutes');
    await page.selectOption('[data-testid="sort-order"]', 'desc');

    // Apply sort
    await page.click('[data-testid="apply-sort"]');

    // Wait for sorted results
    await expect(page.locator('[data-testid="game-card"]')).toBeVisible();
  });

  test('should display game details when clicked', async ({ page }) => {
    await page.goto('/games');

    // Click on first game
    await page.click('[data-testid="game-card"]:first-child');

    // Wait for navigation to game details
    await expect(page).toHaveURL(/\/games\/game1/);
    await expect(page.locator('h1')).toContainText('Game 1');
  });

  test('should handle loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/games**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          games: [],
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

    await page.goto('/games');

    // Check loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

    // Wait for loading to complete
    await expect(
      page.locator('[data-testid="loading-spinner"]')
    ).not.toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/games**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/games');

    // Check error state
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Failed to load games'
    );
  });

  test('should handle empty results', async ({ page }) => {
    // Mock empty API response
    await page.route('**/api/games**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          games: [],
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

    await page.goto('/games');

    // Check empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state"]')).toContainText(
      'No games found'
    );
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/games');

    // Check that mobile layout is applied
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/games');

    // Check that tablet layout is applied
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/games');

    // Check that desktop layout is applied
    await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/games');

    // Focus on filter button
    await page.focus('[data-testid="filter-button"]');

    // Press Enter to open filter dropdown
    await page.keyboard.press('Enter');

    // Wait for filter dropdown to open
    await expect(page.locator('[data-testid="filter-dropdown"]')).toBeVisible();

    // Tab to next element
    await page.keyboard.press('Tab');

    // Check that focus is on next element
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should handle accessibility features', async ({ page }) => {
    await page.goto('/games');

    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();

    // Check for proper button labels
    await expect(page.locator('[data-testid="filter-button"]')).toHaveAttribute(
      'aria-label'
    );

    // Check for proper form labels
    await expect(
      page.locator('[data-testid="start-date-input"]')
    ).toHaveAttribute('aria-label');

    // Check for proper table headers
    await expect(page.locator('[data-testid="game-table"] th')).toHaveCount(6); // Date, Duration, Winner, Status, Participants, Actions

    // Check for proper pagination labels
    await expect(page.locator('[data-testid="pagination"]')).toHaveAttribute(
      'aria-label'
    );
  });

  test('should handle game status indicators', async ({ page }) => {
    await page.goto('/games');

    // Check that status indicators are displayed
    await expect(
      page.locator('[data-testid="status-indicator"]')
    ).toBeVisible();

    // Check that completed games show winner
    await expect(
      page.locator('[data-testid="winner-indicator"]')
    ).toBeVisible();
  });

  test('should handle game duration display', async ({ page }) => {
    await page.goto('/games');

    // Check that duration is displayed in readable format
    await expect(
      page.locator('[data-testid="duration-display"]')
    ).toBeVisible();

    // Check that duration is formatted correctly (e.g., "45 min")
    await expect(
      page.locator('[data-testid="duration-display"]')
    ).toContainText('min');
  });
});
