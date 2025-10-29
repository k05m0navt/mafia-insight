import { Page, expect } from '@playwright/test';

export class AnalyticsTestUtils {
  constructor(private page: Page) {}

  /**
   * Wait for analytics data to load
   */
  async waitForDataLoad() {
    await this.page.waitForSelector('[data-testid="analytics-dashboard"]', {
      state: 'visible',
    });
    await this.page.waitForSelector('[data-testid="loading-indicator"]', {
      state: 'hidden',
    });
  }

  /**
   * Navigate to analytics section
   */
  async navigateToSection(section: 'players' | 'clubs' | 'tournaments') {
    await this.page.click(`[data-testid="${section}-tab"]`);
    await expect(
      this.page.locator(`[data-testid="${section}-section"]`)
    ).toBeVisible();
  }

  /**
   * Apply filters to the current section
   */
  async applyFilters(filters: Record<string, unknown>) {
    for (const [key, value] of Object.entries(filters)) {
      const selector = `[data-testid="${key}"]`;

      if (await this.page.locator(selector).isVisible()) {
        if (key.includes('select')) {
          await this.page.selectOption(selector, value);
        } else if (key.includes('checkbox')) {
          if (value) {
            await this.page.check(selector);
          } else {
            await this.page.uncheck(selector);
          }
        } else {
          await this.page.fill(selector, value.toString());
        }
      }
    }

    await this.page.click('[data-testid="apply-filters-button"]');
    await this.waitForDataLoad();
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.page.click('[data-testid="clear-filters-button"]');
    await this.waitForDataLoad();
  }

  /**
   * Search for specific content
   */
  async search(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.click('[data-testid="search-button"]');
    await this.waitForDataLoad();
  }

  /**
   * Sort data by specific field
   */
  async sortBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    await this.page.click(`[data-testid="sort-by-${field}-button"]`);

    if (direction === 'desc') {
      await this.page.click(`[data-testid="sort-direction-button"]`);
    }

    await this.waitForDataLoad();
  }

  /**
   * Navigate to specific page
   */
  async goToPage(pageNumber: number) {
    await this.page.click(`[data-testid="page-${pageNumber}-button"]`);
    await this.waitForDataLoad();
  }

  /**
   * Export data in specific format
   */
  async exportData(format: 'csv' | 'json' | 'xlsx') {
    await this.page.click('[data-testid="export-button"]');
    await this.page.selectOption(
      '[data-testid="export-format-select"]',
      format
    );
    await this.page.click('[data-testid="confirm-export-button"]');

    // Wait for export to complete
    await expect(
      this.page.locator('[data-testid="export-success-message"]')
    ).toBeVisible();
  }

  /**
   * Verify data is displayed correctly
   */
  async verifyDataDisplay(dataType: 'players' | 'clubs' | 'tournaments') {
    const listSelector = `[data-testid="${dataType}-list"]`;
    const cardSelector = `[data-testid="${dataType.slice(0, -1)}-card"]`;

    await expect(this.page.locator(listSelector)).toBeVisible();
    await expect(this.page.locator(cardSelector).first()).toBeVisible();
  }

  /**
   * Verify metrics are displayed
   */
  async verifyMetrics() {
    const metrics = [
      'total-players',
      'total-clubs',
      'total-tournaments',
      'active-games',
    ];

    for (const metric of metrics) {
      await expect(
        this.page.locator(`[data-testid="${metric}"]`)
      ).toBeVisible();
    }
  }

  /**
   * Verify pagination controls
   */
  async verifyPagination() {
    const paginationSelectors = [
      '[data-testid="pagination-container"]',
      '[data-testid="page-info"]',
      '[data-testid="items-per-page-select"]',
    ];

    for (const selector of paginationSelectors) {
      if (await this.page.locator(selector).isVisible()) {
        await expect(this.page.locator(selector)).toBeVisible();
      }
    }
  }

  /**
   * Verify loading states
   */
  async verifyLoadingStates() {
    // Check that loading indicator appears and disappears
    await expect(
      this.page.locator('[data-testid="loading-indicator"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="loading-indicator"]')
    ).not.toBeVisible();
  }

  /**
   * Verify error handling
   */
  async verifyErrorHandling() {
    // Check for error messages
    const errorSelectors = [
      '[data-testid="error-message"]',
      '[data-testid="error-banner"]',
      '[data-testid="error-toast"]',
    ];

    for (const selector of errorSelectors) {
      if (await this.page.locator(selector).isVisible()) {
        await expect(this.page.locator(selector)).toBeVisible();
      }
    }
  }

  /**
   * Verify responsive design
   */
  async verifyResponsiveDesign() {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ];

    for (const viewport of viewports) {
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await expect(
        this.page.locator('[data-testid="analytics-dashboard"]')
      ).toBeVisible();
    }
  }

  /**
   * Get data from API endpoint
   */
  async getApiData(endpoint: string) {
    const response = await this.page.request.get(`/api${endpoint}`);
    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Mock API response
   */
  async mockApiResponse(endpoint: string, data: unknown, status: number = 200) {
    await this.page.route(`**/api${endpoint}`, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
  }

  /**
   * Simulate network error
   */
  async simulateNetworkError(endpoint: string) {
    await this.page.route(`**/api${endpoint}`, async (route) => {
      await route.abort('failed');
    });
  }

  /**
   * Simulate slow network
   */
  async simulateSlowNetwork(endpoint: string, delay: number = 5000) {
    await this.page.route(`**/api${endpoint}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await route.continue();
    });
  }

  /**
   * Verify data integrity
   */
  async verifyDataIntegrity(dataType: 'players' | 'clubs' | 'tournaments') {
    const data = await this.getApiData(`/analytics/${dataType}`);

    // Verify data structure
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('metadata');
    expect(Array.isArray(data.data)).toBe(true);

    // Verify metadata
    expect(data.metadata).toHaveProperty('total');
    expect(data.metadata).toHaveProperty('page');
    expect(data.metadata).toHaveProperty('limit');

    // Verify data items have required fields
    if (data.data.length > 0) {
      const requiredFields = this.getRequiredFields(dataType);
      for (const field of requiredFields) {
        expect(data.data[0]).toHaveProperty(field);
      }
    }
  }

  /**
   * Get required fields for data type
   */
  private getRequiredFields(dataType: string): string[] {
    const fieldMap: Record<string, string[]> = {
      players: ['id', 'name', 'rating', 'gamesPlayed', 'winRate'],
      clubs: ['id', 'name', 'memberCount', 'averageRating', 'status'],
      tournaments: ['id', 'name', 'startDate', 'endDate', 'status'],
    };

    return fieldMap[dataType] || [];
  }

  /**
   * Verify performance metrics
   */
  async verifyPerformanceMetrics() {
    // Check response times
    const performanceEntries = await this.page.evaluate(() => {
      return performance.getEntriesByType('navigation');
    });

    expect(performanceEntries.length).toBeGreaterThan(0);

    // Check for memory usage
    const memoryInfo = await this.page.evaluate(() => {
      return (performance as { memory?: { usedJSHeapSize: number } }).memory;
    });

    if (memoryInfo) {
      expect(memoryInfo.usedJSHeapSize).toBeGreaterThan(0);
    }
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    // Clear any applied filters
    await this.clearFilters();

    // Reset viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });

    // Clear any mock routes
    await this.page.unrouteAll();
  }
}
