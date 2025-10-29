import { test, expect } from '@playwright/test';

test.describe('Analytics Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should maintain player statistics functionality after changes', async ({
    page,
  }) => {
    // Navigate to analytics
    await page.goto('/analytics');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    // Test player statistics
    await page.click('[data-testid="player-stats-tab"]');
    await expect(page.locator('[data-testid="player-stats"]')).toBeVisible();

    // Verify statistics display
    await expect(page.locator('[data-testid="total-players"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-players"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-rating"]')).toBeVisible();
  });

  test('should maintain tournament analytics functionality after changes', async ({
    page,
  }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Test tournament analytics
    await page.click('[data-testid="tournament-stats-tab"]');
    await expect(
      page.locator('[data-testid="tournament-stats"]')
    ).toBeVisible();

    // Verify tournament statistics
    await expect(
      page.locator('[data-testid="total-tournaments"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="completed-tournaments"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="average-participants"]')
    ).toBeVisible();
  });

  test('should maintain club analytics functionality after changes', async ({
    page,
  }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Test club analytics
    await page.click('[data-testid="club-stats-tab"]');
    await expect(page.locator('[data-testid="club-stats"]')).toBeVisible();

    // Verify club statistics
    await expect(page.locator('[data-testid="total-clubs"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-clubs"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-members"]')).toBeVisible();
  });

  test('should maintain data visualization functionality after changes', async ({
    page,
  }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Test charts and graphs
    await expect(
      page.locator('[data-testid="rating-distribution-chart"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="tournament-timeline-chart"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="club-growth-chart"]')
    ).toBeVisible();

    // Test chart interactions
    await page.hover('[data-testid="rating-distribution-chart"]');
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible();
  });

  test('should maintain filtering functionality after changes', async ({
    page,
  }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Test date range filter
    await page.click('[data-testid="date-range-filter"]');
    await page.selectOption(
      '[data-testid="date-range-select"]',
      'last-30-days'
    );
    await expect(page.locator('[data-testid="filtered-data"]')).toBeVisible();

    // Test player filter
    await page.click('[data-testid="player-filter"]');
    await page.fill('[data-testid="player-search"]', 'test player');
    await expect(
      page.locator('[data-testid="filtered-players"]')
    ).toBeVisible();
  });

  test('should maintain export functionality after changes', async ({
    page,
  }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Test CSV export
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-csv"]');
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();

    // Test PDF export
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-pdf"]');
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
  });

  test('should maintain real-time updates functionality after changes', async ({
    page,
  }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Enable real-time updates
    await page.click('[data-testid="real-time-toggle"]');
    await expect(
      page.locator('[data-testid="real-time-indicator"]')
    ).toBeVisible();

    // Wait for real-time update
    await page.waitForSelector('[data-testid="real-time-update"]', {
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="real-time-update"]')
    ).toBeVisible();
  });

  test('should maintain data refresh functionality after changes', async ({
    page,
  }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Test manual refresh
    await page.click('[data-testid="refresh-button"]');
    await expect(
      page.locator('[data-testid="refreshing-indicator"]')
    ).toBeVisible();

    // Wait for refresh to complete
    await page.waitForSelector('[data-testid="refresh-complete"]', {
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="refresh-complete"]')
    ).toBeVisible();
  });

  test('should maintain performance metrics functionality after changes', async ({
    page,
  }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Test performance metrics
    await page.click('[data-testid="performance-tab"]');
    await expect(
      page.locator('[data-testid="performance-metrics"]')
    ).toBeVisible();

    // Verify performance data
    await expect(page.locator('[data-testid="load-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="response-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-rate"]')).toBeVisible();
  });

  test('should maintain data accuracy after changes', async ({ page }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Verify data accuracy
    const totalPlayers = await page.textContent(
      '[data-testid="total-players"]'
    );
    const activePlayers = await page.textContent(
      '[data-testid="active-players"]'
    );

    expect(parseInt(totalPlayers)).toBeGreaterThanOrEqual(
      parseInt(activePlayers)
    );

    // Test data consistency
    await page.click('[data-testid="player-stats-tab"]');
    await page.click('[data-testid="tournament-stats-tab"]');
    await page.click('[data-testid="club-stats-tab"]');

    // Verify data remains consistent
    await expect(page.locator('[data-testid="consistent-data"]')).toBeVisible();
  });

  test('should maintain error handling after changes', async ({ page }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Simulate network error
    await page.route('**/api/analytics/**', (route) => {
      route.abort('Failed');
    });

    // Test error handling
    await page.click('[data-testid="refresh-button"]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should maintain accessibility after changes', async ({ page }) => {
    // Navigate to analytics
    await page.goto('/analytics');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Test screen reader support
    const ariaLabels = await page.locator('[aria-label]').count();
    expect(ariaLabels).toBeGreaterThan(0);

    // Test high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('[data-testid="dark-mode"]')).toBeVisible();
  });
});
