import { test, expect } from '@playwright/test';

test.describe('Analytics - Clubs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to clubs page
    await page.goto('/clubs');
  });

  test('should display clubs list with search functionality', async ({
    page,
  }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if clubs list is visible
    await expect(page.locator('[data-testid="clubs-list"]')).toBeVisible();

    // Test search functionality
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Wait for search to process

    // Verify search results
    const clubCards = page.locator('[data-testid="club-card"]');
    await expect(clubCards).toHaveCountGreaterThan(0);
  });

  test('should navigate to club analytics page', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on first club card
    const firstClubCard = page.locator('[data-testid="club-card"]').first();
    await firstClubCard.click();

    // Should navigate to club analytics page
    await expect(page).toHaveURL(/\/clubs\/[^\/]+$/);
    await expect(page.locator('h1')).toContainText('Club Analytics');
  });

  test('should display club analytics with member statistics', async ({
    page,
  }) => {
    // Navigate to a specific club's analytics page
    await page.goto('/clubs/test-club-1');
    await page.waitForLoadState('networkidle');

    // Check if analytics components are visible
    await expect(page.locator('[data-testid="team-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="member-list"]')).toBeVisible();

    // Check for key club metrics
    await expect(page.locator('[data-testid="member-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-games"]')).toBeVisible();
    await expect(page.locator('[data-testid="win-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-elo"]')).toBeVisible();
  });

  test('should display role distribution chart', async ({ page }) => {
    await page.goto('/clubs/test-club-1');
    await page.waitForLoadState('networkidle');

    // Check for role distribution visualization
    await expect(
      page.locator('[data-testid="role-distribution"]')
    ).toBeVisible();

    // Verify role data is displayed
    const roleItems = page.locator('[data-testid="role-item"]');
    await expect(roleItems).toHaveCountGreaterThan(0);
  });

  test('should display top performers section', async ({ page }) => {
    await page.goto('/clubs/test-club-1');
    await page.waitForLoadState('networkidle');

    // Check for top performers section
    await expect(page.locator('[data-testid="top-performers"]')).toBeVisible();

    // Verify performer cards are displayed
    const performerCards = page.locator('[data-testid="performer-card"]');
    await expect(performerCards).toHaveCountGreaterThan(0);
  });

  test('should handle empty state when no clubs found', async ({ page }) => {
    // Search for non-existent club
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('nonexistentclub12345');
    await page.waitForTimeout(500);

    // Should show empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No clubs found')).toBeVisible();
  });

  test('should display club member details', async ({ page }) => {
    await page.goto('/clubs/test-club-1');
    await page.waitForLoadState('networkidle');

    // Check member list is visible
    await expect(page.locator('[data-testid="member-list"]')).toBeVisible();

    // Verify member cards show key information
    const memberCards = page.locator('[data-testid="member-card"]');
    await expect(memberCards).toHaveCountGreaterThan(0);

    // Check for member details
    const firstMember = memberCards.first();
    await expect(
      firstMember.locator('[data-testid="member-name"]')
    ).toBeVisible();
    await expect(
      firstMember.locator('[data-testid="member-elo"]')
    ).toBeVisible();
    await expect(
      firstMember.locator('[data-testid="member-games"]')
    ).toBeVisible();
  });

  test('should handle member click navigation', async ({ page }) => {
    await page.goto('/clubs/test-club-1');
    await page.waitForLoadState('networkidle');

    // Click on first member
    const firstMember = page.locator('[data-testid="member-card"]').first();
    await firstMember.click();

    // Should navigate to player page
    await expect(page).toHaveURL(/\/players\/[^\/]+$/);
  });
});
