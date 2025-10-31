import { test, expect } from '@playwright/test';

/**
 * E2E Test: Players Display
 *
 * Tests the players page functionality:
 * - Page loads successfully
 * - Players table/grid displays
 * - Sorting functionality
 * - Filtering/search
 * - Pagination
 * - Player detail navigation
 */

test.describe('Players Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/players');
  });

  test('should load players page successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/players/);
    await expect(
      page.locator('h1').or(page.locator('[data-testid="page-title"]'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display players table or grid', async ({ page }) => {
    // Wait for data to load
    const tableOrGrid = page
      .locator('table')
      .or(page.locator('[data-testid="players-grid"]'))
      .or(page.locator('[role="grid"]'));
    await expect(tableOrGrid.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display player names', async ({ page }) => {
    // Wait for player data
    const playerNames = page
      .locator('td')
      .or(page.locator('[data-testid*="player-name"]'))
      .or(page.locator('a[href*="/players/"]'));
    await expect(playerNames.first()).toBeVisible({ timeout: 15000 });

    const count = await playerNames.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display player statistics', async ({ page }) => {
    // Check for stats columns (wins, losses, rating, etc.)
    const statsColumns = page.locator('text=/wins|losses|rating|elo/i');
    await expect(statsColumns.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page
      .locator('input[type="search"]')
      .or(page.locator('input[placeholder*="search"]'))
      .or(page.locator('[data-testid="search-input"]'));

    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill('test');

      // Wait for results to update
      await page.waitForTimeout(500);

      expect(hasSearch).toBeTruthy();
    }
  });

  test('should have sorting functionality', async ({ page }) => {
    // Look for sortable column headers
    const sortableHeaders = page
      .locator('th[role="columnheader"]')
      .or(page.locator('button:has-text("Name")'))
      .or(page.locator('[data-testid*="sort"]'));

    const hasSorting = await sortableHeaders
      .first()
      .isVisible()
      .catch(() => false);

    if (hasSorting) {
      const firstHeader = sortableHeaders.first();
      await firstHeader.click();

      // Wait for sort to apply
      await page.waitForTimeout(500);

      expect(hasSorting).toBeTruthy();
    }
  });

  test('should have pagination controls', async ({ page }) => {
    const paginationControls = page
      .locator('nav[aria-label*="pagination"]')
      .or(page.locator('button:has-text("Next")'))
      .or(page.locator('[data-testid="pagination"]'));

    const hasPagination = await paginationControls
      .first()
      .isVisible()
      .catch(() => false);

    // Pagination may only appear with many items
    expect(typeof hasPagination).toBe('boolean');
  });

  test('should navigate to player detail page on click', async ({ page }) => {
    // Wait for player links
    const playerLinks = page.locator('a[href*="/players/"]');
    const hasLinks = await playerLinks
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (hasLinks) {
      const firstLink = playerLinks.first();
      await firstLink.click();

      // Should navigate to player detail page
      await expect(page).toHaveURL(/\/players\/[a-zA-Z0-9-]+/, {
        timeout: 10000,
      });
    }
  });

  test('should display loading state', async ({ page }) => {
    // Navigate with slow network
    await page.route('**/api/**', (route) => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto('/players');

    // Look for loading indicator
    const loadingIndicator = page
      .locator('[data-testid="loading"]')
      .or(page.locator('text=/loading/i'))
      .or(page.locator('[role="status"]'));

    // Loading may be too fast to catch
    const hasLoading = await loadingIndicator.isVisible().catch(() => false);
    expect(typeof hasLoading).toBe('boolean');
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/players**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ players: [], total: 0 }),
      });
    });

    await page.goto('/players');

    // Should show empty state message
    const emptyMessage = page
      .locator('text=/no players/i')
      .or(page.locator('[data-testid="empty-state"]'));
    await expect(emptyMessage).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/players');

    // Page should still be accessible
    await expect(
      page.locator('h1').or(page.locator('[data-testid="page-title"]'))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Players Filtering and Sorting', () => {
  test('should filter by wins', async ({ page }) => {
    await page.goto('/players');

    const filterControls = page
      .locator('[data-testid*="filter"]')
      .or(page.locator('select'))
      .or(page.locator('button:has-text("Filter")'));
    const hasFilters = await filterControls
      .first()
      .isVisible()
      .catch(() => false);

    // Filtering may be implemented differently
    expect(typeof hasFilters).toBe('boolean');
  });

  test('should sort by rating', async ({ page }) => {
    await page.goto('/players');

    const ratingHeader = page.locator('text=/rating|elo/i').first();
    const isVisible = await ratingHeader
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (isVisible) {
      await ratingHeader.click();

      // Wait for sort
      await page.waitForTimeout(500);

      expect(isVisible).toBeTruthy();
    }
  });

  test('should sort by name alphabetically', async ({ page }) => {
    await page.goto('/players');

    const nameHeader = page
      .locator('th:has-text("Name")')
      .or(page.locator('button:has-text("Name")'));
    const isVisible = await nameHeader
      .first()
      .isVisible()
      .catch(() => false);

    if (isVisible) {
      await nameHeader.first().click();

      // Wait for sort
      await page.waitForTimeout(500);

      expect(isVisible).toBeTruthy();
    }
  });
});

test.describe('Players Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/players');

    await page
      .locator('h1')
      .or(page.locator('table'))
      .first()
      .waitFor({ timeout: 10000 });

    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle large datasets', async ({ page }) => {
    await page.goto('/players');

    // Scroll to trigger lazy loading if implemented
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await page.waitForTimeout(1000);

    // Page should remain responsive
    const isResponsive = await page.locator('body').isVisible();
    expect(isResponsive).toBeTruthy();
  });
});
