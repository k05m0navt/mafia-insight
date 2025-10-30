import { Page } from '@playwright/test';

export class AnalyticsTestSuite {
  constructor(private page: Page) {}

  async loadAnalyticsDashboard() {
    await this.page.goto('/analytics');
    await expect(
      this.page.locator('[data-testid="analytics-dashboard"]')
    ).toBeVisible();
  }

  async verifyOverviewMetrics() {
    // Check that overview metrics are displayed
    await expect(
      this.page.locator('[data-testid="total-players"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="total-clubs"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="total-tournaments"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="active-games"]')
    ).toBeVisible();
  }

  async verifyPlayersSection() {
    // Navigate to players section
    await this.page.click('[data-testid="players-tab"]');
    await expect(
      this.page.locator('[data-testid="players-section"]')
    ).toBeVisible();

    // Verify players list is loaded
    await expect(
      this.page.locator('[data-testid="players-list"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="player-card"]').first()
    ).toBeVisible();
  }

  async verifyClubsSection() {
    // Navigate to clubs section
    await this.page.click('[data-testid="clubs-tab"]');
    await expect(
      this.page.locator('[data-testid="clubs-section"]')
    ).toBeVisible();

    // Verify clubs list is loaded
    await expect(this.page.locator('[data-testid="clubs-list"]')).toBeVisible();
    await expect(
      this.page.locator('[data-testid="club-card"]').first()
    ).toBeVisible();
  }

  async verifyTournamentsSection() {
    // Navigate to tournaments section
    await this.page.click('[data-testid="tournaments-tab"]');
    await expect(
      this.page.locator('[data-testid="tournaments-section"]')
    ).toBeVisible();

    // Verify tournaments list is loaded
    await expect(
      this.page.locator('[data-testid="tournaments-list"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="tournament-card"]').first()
    ).toBeVisible();
  }

  async testPlayerFiltering() {
    // Navigate to players section
    await this.page.click('[data-testid="players-tab"]');

    // Test rating filter
    await this.page.fill('[data-testid="rating-min-input"]', '1500');
    await this.page.fill('[data-testid="rating-max-input"]', '2000');
    await this.page.click('[data-testid="apply-filters-button"]');

    // Verify filtered results
    await expect(
      this.page.locator('[data-testid="players-list"]')
    ).toBeVisible();

    // Test category filter
    await this.page.selectOption('[data-testid="category-select"]', 'premium');
    await this.page.click('[data-testid="apply-filters-button"]');

    // Verify filtered results
    await expect(
      this.page.locator('[data-testid="players-list"]')
    ).toBeVisible();
  }

  async testClubFiltering() {
    // Navigate to clubs section
    await this.page.click('[data-testid="clubs-tab"]');

    // Test member count filter
    await this.page.fill('[data-testid="member-count-min-input"]', '10');
    await this.page.fill('[data-testid="member-count-max-input"]', '30');
    await this.page.click('[data-testid="apply-filters-button"]');

    // Verify filtered results
    await expect(this.page.locator('[data-testid="clubs-list"]')).toBeVisible();
  }

  async testTournamentFiltering() {
    // Navigate to tournaments section
    await this.page.click('[data-testid="tournaments-tab"]');

    // Test date range filter
    await this.page.fill('[data-testid="start-date-input"]', '2025-01-01');
    await this.page.fill('[data-testid="end-date-input"]', '2025-12-31');
    await this.page.click('[data-testid="apply-filters-button"]');

    // Verify filtered results
    await expect(
      this.page.locator('[data-testid="tournaments-list"]')
    ).toBeVisible();
  }

  async testDataExport() {
    // Test players data export
    await this.page.click('[data-testid="players-tab"]');
    await this.page.click('[data-testid="export-button"]');
    await this.page.selectOption('[data-testid="export-format-select"]', 'csv');
    await this.page.click('[data-testid="confirm-export-button"]');

    // Verify export success message
    await expect(
      this.page.locator('[data-testid="export-success-message"]')
    ).toBeVisible();
  }

  async testSearchFunctionality() {
    // Test global search
    await this.page.fill('[data-testid="global-search-input"]', 'alpha');
    await this.page.click('[data-testid="search-button"]');

    // Verify search results
    await expect(
      this.page.locator('[data-testid="search-results"]')
    ).toBeVisible();
  }

  async testPagination() {
    // Navigate to players section
    await this.page.click('[data-testid="players-tab"]');

    // Test pagination
    if (
      await this.page.locator('[data-testid="next-page-button"]').isVisible()
    ) {
      await this.page.click('[data-testid="next-page-button"]');
      await expect(
        this.page.locator('[data-testid="players-list"]')
      ).toBeVisible();
    }
  }

  async testSorting() {
    // Navigate to players section
    await this.page.click('[data-testid="players-tab"]');

    // Test sorting by rating
    await this.page.click('[data-testid="sort-by-rating-button"]');
    await expect(
      this.page.locator('[data-testid="players-list"]')
    ).toBeVisible();

    // Test sorting by name
    await this.page.click('[data-testid="sort-by-name-button"]');
    await expect(
      this.page.locator('[data-testid="players-list"]')
    ).toBeVisible();
  }

  async testResponsiveDesign() {
    // Test mobile view
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(
      this.page.locator('[data-testid="analytics-dashboard"]')
    ).toBeVisible();

    // Test tablet view
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(
      this.page.locator('[data-testid="analytics-dashboard"]')
    ).toBeVisible();

    // Reset to desktop view
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async testErrorHandling() {
    // Test with invalid filters
    await this.page.click('[data-testid="players-tab"]');
    await this.page.fill('[data-testid="rating-min-input"]', 'invalid');
    await this.page.click('[data-testid="apply-filters-button"]');

    // Verify error message
    await expect(
      this.page.locator('[data-testid="error-message"]')
    ).toBeVisible();
  }

  async testLoadingStates() {
    // Test loading indicators
    await this.page.click('[data-testid="players-tab"]');

    // Verify loading state appears
    await expect(
      this.page.locator('[data-testid="loading-indicator"]')
    ).toBeVisible();

    // Wait for loading to complete
    await expect(
      this.page.locator('[data-testid="loading-indicator"]')
    ).not.toBeVisible();
  }

  async testDataRefresh() {
    // Test data refresh functionality
    await this.page.click('[data-testid="refresh-button"]');

    // Verify data is refreshed
    await expect(
      this.page.locator('[data-testid="last-updated"]')
    ).toBeVisible();
  }

  async runFullAnalyticsTest() {
    await this.loadAnalyticsDashboard();
    await this.verifyOverviewMetrics();
    await this.verifyPlayersSection();
    await this.verifyClubsSection();
    await this.verifyTournamentsSection();
    await this.testPlayerFiltering();
    await this.testClubFiltering();
    await this.testTournamentFiltering();
    await this.testDataExport();
    await this.testSearchFunctionality();
    await this.testPagination();
    await this.testSorting();
    await this.testResponsiveDesign();
    await this.testErrorHandling();
    await this.testLoadingStates();
    await this.testDataRefresh();
  }
}
