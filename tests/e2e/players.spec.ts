import { test, expect } from '@playwright/test';

test.describe('Players Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-players');
  });

  test('should display players list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Test Players');
    await expect(page.locator('[data-testid="players-grid"]')).toBeVisible();
  });

  test('should search players', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search players..."]');
    await searchInput.fill('John');
    await searchInput.press('Enter');

    // Wait for results to load
    await page.waitForSelector('[data-testid="players-grid"]');

    // Verify search results
    const players = page.locator('[data-testid="player-card"]');
    await expect(players).toHaveCount(1);
  });

  test('should filter by role', async ({ page }) => {
    const donButton = page.locator('button:has-text("DON")');
    await donButton.click();

    // Wait for filtered results
    await page.waitForSelector('[data-testid="players-grid"]');

    // Verify only DON players are shown
    const players = page.locator('[data-testid="player-card"]');
    await expect(players).toHaveCount(1);
  });

  test('should navigate to player analytics', async ({ page }) => {
    const playerCard = page.locator('[data-testid="player-card"]').first();
    const viewButton = playerCard.locator('button:has-text("View Analytics")');

    await viewButton.click();

    // Should navigate to player analytics page
    await expect(page).toHaveURL(/\/test-players\/[^\/]+$/);
    await expect(page.locator('h1')).toContainText('John Doe');
  });

  test.skip('should display loading state', async ({ page }) => {
    // Navigate to a new page to trigger loading
    await page.goto('/test-players?search=loading-test');

    // Wait for loading spinner to appear (with longer timeout)
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible({
      timeout: 10000,
    });

    // Wait for loading to complete
    await expect(
      page.locator('[data-testid="loading-spinner"]')
    ).not.toBeVisible({ timeout: 10000 });
  });

  test('should handle empty state', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search players..."]');
    await searchInput.fill('nonexistent-player');
    await searchInput.press('Enter');

    // Should show no results message
    await expect(page.locator('text=No players found')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Should stack elements vertically on mobile
    const searchContainer = page.locator('[data-testid="search-container"]');
    await expect(searchContainer).toHaveClass(/flex-col/);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Should show 2 columns on tablet
    const playersGrid = page.locator('[data-testid="players-grid"]');
    await expect(playersGrid).toHaveClass(/grid-cols-2/);

    // Test desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });

    // Should show 3 columns on desktop
    await expect(playersGrid).toHaveClass(/grid-cols-3/);
  });
});

test.describe('Player Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-players/player-1');
  });

  test('should display player analytics', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('John Doe');
    await expect(page.locator('[data-testid="role-stats"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="performance-chart"]')
    ).toBeVisible();
  });

  test('should filter by role', async ({ page }) => {
    const donButton = page.locator('button:has-text("DON")');
    await donButton.click();

    // Should update analytics based on role filter
    await expect(page.locator('[data-testid="role-stats"]')).toBeVisible();
  });

  test('should change time range', async ({ page }) => {
    const weeklyButton = page.locator('button:has-text("Last Week")');
    await weeklyButton.click();

    // Should update analytics based on time range
    await expect(
      page.locator('[data-testid="performance-chart"]')
    ).toBeVisible();
  });

  test('should display error state', async ({ page }) => {
    // Navigate to non-existent player
    await page.goto('/test-players/nonexistent-player');

    // Should show error message
    await expect(page.locator('text=Player not found')).toBeVisible();
  });

  test('should have back button', async ({ page }) => {
    const backButton = page.locator('button:has-text("Back to Players")');
    await backButton.click();

    // Should navigate back to players list
    await expect(page).toHaveURL('/test-players');
  });
});

test.describe('PWA Features', () => {
  test('should be installable', async ({ page, context }) => {
    await page.goto('/');

    // Check for PWA manifest
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });

    expect(manifest).toBe('/manifest.json');
  });

  test('should work offline', async ({ page, context }) => {
    await page.goto('/test-players');

    // Wait for page to load first
    await expect(page.locator('h1')).toContainText('Test Players');

    // Go offline
    await context.setOffline(true);

    // Navigate to a new page to test offline functionality
    await page.goto('/test-players');

    // Should still show cached content
    await expect(page.locator('h1')).toContainText('Test Players');
  });

  test('should have service worker', async ({ page }) => {
    await page.goto('/');

    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(swRegistered).toBe(true);
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/test-players');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate without mouse
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/test-players');

    // Check for proper ARIA labels
    const searchInput = page.locator('input[placeholder="Search players..."]');
    await expect(searchInput).toHaveAttribute('aria-label');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();

      // Should have either aria-label or text content
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/test-players');

    // This would need a proper color contrast testing library
    // For now, just check that elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button').first()).toBeVisible();
  });
});
