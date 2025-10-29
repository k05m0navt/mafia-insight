import { Page } from '@playwright/test';
import { AnalyticsTestUtils } from './AnalyticsTestUtils';

export class AnalyticsScenarios {
  private utils: AnalyticsTestUtils;

  constructor(private page: Page) {
    this.utils = new AnalyticsTestUtils(page);
  }

  /**
   * Scenario: Load analytics dashboard and verify overview
   */
  async loadDashboardScenario() {
    await this.page.goto('/analytics');
    await this.utils.waitForDataLoad();
    await this.utils.verifyMetrics();
    await this.utils.verifyDataDisplay('players');
  }

  /**
   * Scenario: Filter players by rating range
   */
  async filterPlayersByRatingScenario() {
    await this.utils.navigateToSection('players');

    const filters = {
      'rating-min-input': '1500',
      'rating-max-input': '2000',
    };

    await this.utils.applyFilters(filters);
    await this.utils.verifyDataDisplay('players');
  }

  /**
   * Scenario: Filter players by category
   */
  async filterPlayersByCategoryScenario() {
    await this.utils.navigateToSection('players');

    const filters = {
      'category-select': 'premium',
    };

    await this.utils.applyFilters(filters);
    await this.utils.verifyDataDisplay('players');
  }

  /**
   * Scenario: Filter clubs by member count
   */
  async filterClubsByMemberCountScenario() {
    await this.utils.navigateToSection('clubs');

    const filters = {
      'member-count-min-input': '10',
      'member-count-max-input': '30',
    };

    await this.utils.applyFilters(filters);
    await this.utils.verifyDataDisplay('clubs');
  }

  /**
   * Scenario: Filter tournaments by date range
   */
  async filterTournamentsByDateScenario() {
    await this.utils.navigateToSection('tournaments');

    const filters = {
      'start-date-input': '2025-01-01',
      'end-date-input': '2025-12-31',
    };

    await this.utils.applyFilters(filters);
    await this.utils.verifyDataDisplay('tournaments');
  }

  /**
   * Scenario: Search for specific content
   */
  async searchContentScenario() {
    await this.utils.navigateToSection('players');
    await this.utils.search('alpha');
    await this.utils.verifyDataDisplay('players');
  }

  /**
   * Scenario: Sort data by different fields
   */
  async sortDataScenario() {
    await this.utils.navigateToSection('players');

    // Sort by rating descending
    await this.utils.sortBy('rating', 'desc');
    await this.utils.verifyDataDisplay('players');

    // Sort by name ascending
    await this.utils.sortBy('name', 'asc');
    await this.utils.verifyDataDisplay('players');
  }

  /**
   * Scenario: Test pagination
   */
  async paginationScenario() {
    await this.utils.navigateToSection('players');

    // Check if pagination exists
    if (
      await this.page.locator('[data-testid="next-page-button"]').isVisible()
    ) {
      await this.utils.goToPage(2);
      await this.utils.verifyDataDisplay('players');

      // Go back to first page
      await this.utils.goToPage(1);
      await this.utils.verifyDataDisplay('players');
    }
  }

  /**
   * Scenario: Export data in different formats
   */
  async exportDataScenario() {
    await this.utils.navigateToSection('players');

    // Export as CSV
    await this.utils.exportData('csv');

    // Export as JSON
    await this.utils.exportData('json');
  }

  /**
   * Scenario: Test responsive design
   */
  async responsiveDesignScenario() {
    await this.utils.navigateToSection('players');
    await this.utils.verifyResponsiveDesign();
  }

  /**
   * Scenario: Test error handling
   */
  async errorHandlingScenario() {
    await this.utils.navigateToSection('players');

    // Apply invalid filters
    const invalidFilters = {
      'rating-min-input': 'invalid',
      'rating-max-input': 'also-invalid',
    };

    await this.utils.applyFilters(invalidFilters);
    await this.utils.verifyErrorHandling();
  }

  /**
   * Scenario: Test loading states
   */
  async loadingStatesScenario() {
    await this.utils.navigateToSection('players');
    await this.utils.verifyLoadingStates();
  }

  /**
   * Scenario: Test data refresh
   */
  async dataRefreshScenario() {
    await this.utils.navigateToSection('players');

    // Click refresh button
    await this.page.click('[data-testid="refresh-button"]');
    await this.utils.waitForDataLoad();
    await this.utils.verifyDataDisplay('players');
  }

  /**
   * Scenario: Test complex filtering
   */
  async complexFilteringScenario() {
    await this.utils.navigateToSection('players');

    const complexFilters = {
      'rating-min-input': '1500',
      'rating-max-input': '2000',
      'category-select': 'premium',
      'status-select': 'active',
    };

    await this.utils.applyFilters(complexFilters);
    await this.utils.verifyDataDisplay('players');
  }

  /**
   * Scenario: Test data integrity
   */
  async dataIntegrityScenario() {
    await this.utils.verifyDataIntegrity('players');
    await this.utils.verifyDataIntegrity('clubs');
    await this.utils.verifyDataIntegrity('tournaments');
  }

  /**
   * Scenario: Test performance
   */
  async performanceScenario() {
    await this.utils.navigateToSection('players');
    await this.utils.verifyPerformanceMetrics();
  }

  /**
   * Scenario: Test API error handling
   */
  async apiErrorScenario() {
    // Mock API error
    await this.utils.simulateNetworkError('/analytics/players');

    await this.utils.navigateToSection('players');
    await this.utils.verifyErrorHandling();
  }

  /**
   * Scenario: Test slow network
   */
  async slowNetworkScenario() {
    // Simulate slow network
    await this.utils.simulateSlowNetwork('/analytics/players', 3000);

    await this.utils.navigateToSection('players');
    await this.utils.verifyLoadingStates();
  }

  /**
   * Scenario: Test empty state
   */
  async emptyStateScenario() {
    // Mock empty response
    await this.utils.mockApiResponse('/analytics/players', {
      data: [],
      metadata: { total: 0 },
    });

    await this.utils.navigateToSection('players');

    // Verify empty state is displayed
    await this.page.waitForSelector('[data-testid="empty-state"]', {
      state: 'visible',
    });
  }

  /**
   * Scenario: Test data validation
   */
  async dataValidationScenario() {
    await this.utils.navigateToSection('players');

    // Test invalid date range
    const invalidDateFilters = {
      'start-date-input': '2025-12-31',
      'end-date-input': '2025-01-01', // End date before start date
    };

    await this.utils.applyFilters(invalidDateFilters);
    await this.utils.verifyErrorHandling();
  }

  /**
   * Scenario: Test accessibility
   */
  async accessibilityScenario() {
    await this.utils.navigateToSection('players');

    // Test keyboard navigation
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Enter');

    // Test screen reader compatibility
    const elements = await this.page.locator('[aria-label]').all();
    expect(elements.length).toBeGreaterThan(0);
  }

  /**
   * Scenario: Test concurrent operations
   */
  async concurrentOperationsScenario() {
    await this.utils.navigateToSection('players');

    // Apply filters while data is loading
    const filters = {
      'rating-min-input': '1500',
      'rating-max-input': '2000',
    };

    await this.utils.applyFilters(filters);

    // Try to sort while filtering
    await this.utils.sortBy('rating', 'desc');

    // Verify final state
    await this.utils.verifyDataDisplay('players');
  }

  /**
   * Scenario: Test data persistence
   */
  async dataPersistenceScenario() {
    await this.utils.navigateToSection('players');

    // Apply filters
    const filters = {
      'rating-min-input': '1500',
      'rating-max-input': '2000',
    };

    await this.utils.applyFilters(filters);

    // Navigate away and back
    await this.utils.navigateToSection('clubs');
    await this.utils.navigateToSection('players');

    // Verify filters are still applied
    await this.utils.verifyDataDisplay('players');
  }

  /**
   * Run all scenarios
   */
  async runAllScenarios() {
    const scenarios = [
      this.loadDashboardScenario,
      this.filterPlayersByRatingScenario,
      this.filterPlayersByCategoryScenario,
      this.filterClubsByMemberCountScenario,
      this.filterTournamentsByDateScenario,
      this.searchContentScenario,
      this.sortDataScenario,
      this.paginationScenario,
      this.exportDataScenario,
      this.responsiveDesignScenario,
      this.errorHandlingScenario,
      this.loadingStatesScenario,
      this.dataRefreshScenario,
      this.complexFilteringScenario,
      this.dataIntegrityScenario,
      this.performanceScenario,
      this.apiErrorScenario,
      this.slowNetworkScenario,
      this.emptyStateScenario,
      this.dataValidationScenario,
      this.accessibilityScenario,
      this.concurrentOperationsScenario,
      this.dataPersistenceScenario,
    ];

    for (const scenario of scenarios) {
      try {
        await scenario.call(this);
        console.log(`✅ Scenario completed: ${scenario.name}`);
      } catch (error) {
        console.error(`❌ Scenario failed: ${scenario.name}`, error);
        throw error;
      }
    }
  }
}
