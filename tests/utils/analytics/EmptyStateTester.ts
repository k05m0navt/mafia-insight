import { Page, expect } from '@playwright/test';

export interface EmptyStateTestResult {
  testName: string;
  status: 'passed' | 'failed';
  message: string;
  screenshot?: string;
  timestamp: string;
}

export class EmptyStateTester {
  constructor(private page: Page) {}

  /**
   * Test empty state for players section
   */
  async testEmptyPlayersState(): Promise<EmptyStateTestResult> {
    const testName = 'Empty Players State';
    const timestamp = new Date().toISOString();

    try {
      // Mock empty API response
      await this.page.route('**/api/analytics/players**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            metadata: {
              total: 0,
              page: 1,
              limit: 50,
              hasMore: false,
              lastUpdated: new Date().toISOString(),
            },
          }),
        });
      });

      // Navigate to players section
      await this.page.goto('/analytics');
      await this.page.click('[data-testid="players-tab"]');

      // Wait for empty state to appear
      await expect(
        this.page.locator('[data-testid="empty-state"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="empty-state-title"]')
      ).toContainText('No players found');
      await expect(
        this.page.locator('[data-testid="empty-state-description"]')
      ).toContainText('Try adjusting your filters or search criteria');

      // Check for empty state actions
      await expect(
        this.page.locator('[data-testid="clear-filters-button"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="refresh-button"]')
      ).toBeVisible();

      // Take screenshot
      const screenshot = await this.page.screenshot({
        path: `test-results/empty-states/players-empty-${Date.now()}.png`,
        fullPage: true,
      });

      return {
        testName,
        status: 'passed',
        message: 'Empty players state displayed correctly',
        screenshot: screenshot.toString('base64'),
        timestamp,
      };
    } catch (error) {
      return {
        testName,
        status: 'failed',
        message: `Empty players state test failed: ${error.message}`,
        timestamp,
      };
    }
  }

  /**
   * Test empty state for clubs section
   */
  async testEmptyClubsState(): Promise<EmptyStateTestResult> {
    const testName = 'Empty Clubs State';
    const timestamp = new Date().toISOString();

    try {
      // Mock empty API response
      await this.page.route('**/api/analytics/clubs**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            metadata: {
              total: 0,
              page: 1,
              limit: 50,
              hasMore: false,
              lastUpdated: new Date().toISOString(),
            },
          }),
        });
      });

      // Navigate to clubs section
      await this.page.goto('/analytics');
      await this.page.click('[data-testid="clubs-tab"]');

      // Wait for empty state to appear
      await expect(
        this.page.locator('[data-testid="empty-state"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="empty-state-title"]')
      ).toContainText('No clubs found');
      await expect(
        this.page.locator('[data-testid="empty-state-description"]')
      ).toContainText('Try adjusting your filters or search criteria');

      // Check for empty state actions
      await expect(
        this.page.locator('[data-testid="clear-filters-button"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="refresh-button"]')
      ).toBeVisible();

      // Take screenshot
      const screenshot = await this.page.screenshot({
        path: `test-results/empty-states/clubs-empty-${Date.now()}.png`,
        fullPage: true,
      });

      return {
        testName,
        status: 'passed',
        message: 'Empty clubs state displayed correctly',
        screenshot: screenshot.toString('base64'),
        timestamp,
      };
    } catch (error) {
      return {
        testName,
        status: 'failed',
        message: `Empty clubs state test failed: ${error.message}`,
        timestamp,
      };
    }
  }

  /**
   * Test empty state for tournaments section
   */
  async testEmptyTournamentsState(): Promise<EmptyStateTestResult> {
    const testName = 'Empty Tournaments State';
    const timestamp = new Date().toISOString();

    try {
      // Mock empty API response
      await this.page.route('**/api/analytics/tournaments**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            metadata: {
              total: 0,
              page: 1,
              limit: 50,
              hasMore: false,
              lastUpdated: new Date().toISOString(),
            },
          }),
        });
      });

      // Navigate to tournaments section
      await this.page.goto('/analytics');
      await this.page.click('[data-testid="tournaments-tab"]');

      // Wait for empty state to appear
      await expect(
        this.page.locator('[data-testid="empty-state"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="empty-state-title"]')
      ).toContainText('No tournaments found');
      await expect(
        this.page.locator('[data-testid="empty-state-description"]')
      ).toContainText('Try adjusting your filters or search criteria');

      // Check for empty state actions
      await expect(
        this.page.locator('[data-testid="clear-filters-button"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="refresh-button"]')
      ).toBeVisible();

      // Take screenshot
      const screenshot = await this.page.screenshot({
        path: `test-results/empty-states/tournaments-empty-${Date.now()}.png`,
        fullPage: true,
      });

      return {
        testName,
        status: 'passed',
        message: 'Empty tournaments state displayed correctly',
        screenshot: screenshot.toString('base64'),
        timestamp,
      };
    } catch (error) {
      return {
        testName,
        status: 'failed',
        message: `Empty tournaments state test failed: ${error.message}`,
        timestamp,
      };
    }
  }

  /**
   * Test empty state after filtering
   */
  async testEmptyStateAfterFiltering(): Promise<EmptyStateTestResult> {
    const testName = 'Empty State After Filtering';
    const timestamp = new Date().toISOString();

    try {
      // Mock filtered API response with no results
      await this.page.route('**/api/analytics/players**', async (route) => {
        const url = new URL(route.request().url());
        const filters = url.searchParams.get('filters');

        // If filters are applied, return empty results
        if (filters) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [],
              metadata: {
                total: 0,
                page: 1,
                limit: 50,
                hasMore: false,
                lastUpdated: new Date().toISOString(),
              },
            }),
          });
        } else {
          // Return normal data for initial load
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [
                { id: '1', name: 'Player 1', rating: 1500 },
                { id: '2', name: 'Player 2', rating: 1600 },
              ],
              metadata: {
                total: 2,
                page: 1,
                limit: 50,
                hasMore: false,
                lastUpdated: new Date().toISOString(),
              },
            }),
          });
        }
      });

      // Navigate to players section
      await this.page.goto('/analytics');
      await this.page.click('[data-testid="players-tab"]');

      // Wait for initial data to load
      await expect(
        this.page.locator('[data-testid="players-list"]')
      ).toBeVisible();

      // Apply filters that will result in empty state
      await this.page.fill('[data-testid="rating-min-input"]', '3000');
      await this.page.fill('[data-testid="rating-max-input"]', '4000');
      await this.page.click('[data-testid="apply-filters-button"]');

      // Wait for empty state to appear
      await expect(
        this.page.locator('[data-testid="empty-state"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="empty-state-title"]')
      ).toContainText('No players found');
      await expect(
        this.page.locator('[data-testid="empty-state-description"]')
      ).toContainText('Try adjusting your filters or search criteria');

      // Check for filter-specific empty state actions
      await expect(
        this.page.locator('[data-testid="clear-filters-button"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="reset-filters-button"]')
      ).toBeVisible();

      // Take screenshot
      const screenshot = await this.page.screenshot({
        path: `test-results/empty-states/filtered-empty-${Date.now()}.png`,
        fullPage: true,
      });

      return {
        testName,
        status: 'passed',
        message: 'Empty state after filtering displayed correctly',
        screenshot: screenshot.toString('base64'),
        timestamp,
      };
    } catch (error) {
      return {
        testName,
        status: 'failed',
        message: `Empty state after filtering test failed: ${error.message}`,
        timestamp,
      };
    }
  }

  /**
   * Test empty state after search
   */
  async testEmptyStateAfterSearch(): Promise<EmptyStateTestResult> {
    const testName = 'Empty State After Search';
    const timestamp = new Date().toISOString();

    try {
      // Mock search API response with no results
      await this.page.route('**/api/analytics/players**', async (route) => {
        const url = new URL(route.request().url());
        const search = url.searchParams.get('search');

        // If search is applied, return empty results
        if (search) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [],
              metadata: {
                total: 0,
                page: 1,
                limit: 50,
                hasMore: false,
                lastUpdated: new Date().toISOString(),
              },
            }),
          });
        } else {
          // Return normal data for initial load
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [
                { id: '1', name: 'Player 1', rating: 1500 },
                { id: '2', name: 'Player 2', rating: 1600 },
              ],
              metadata: {
                total: 2,
                page: 1,
                limit: 50,
                hasMore: false,
                lastUpdated: new Date().toISOString(),
              },
            }),
          });
        }
      });

      // Navigate to players section
      await this.page.goto('/analytics');
      await this.page.click('[data-testid="players-tab"]');

      // Wait for initial data to load
      await expect(
        this.page.locator('[data-testid="players-list"]')
      ).toBeVisible();

      // Perform search that will result in empty state
      await this.page.fill('[data-testid="search-input"]', 'nonexistentplayer');
      await this.page.click('[data-testid="search-button"]');

      // Wait for empty state to appear
      await expect(
        this.page.locator('[data-testid="empty-state"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="empty-state-title"]')
      ).toContainText('No players found');
      await expect(
        this.page.locator('[data-testid="empty-state-description"]')
      ).toContainText('Try adjusting your search terms');

      // Check for search-specific empty state actions
      await expect(
        this.page.locator('[data-testid="clear-search-button"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="refresh-button"]')
      ).toBeVisible();

      // Take screenshot
      const screenshot = await this.page.screenshot({
        path: `test-results/empty-states/search-empty-${Date.now()}.png`,
        fullPage: true,
      });

      return {
        testName,
        status: 'passed',
        message: 'Empty state after search displayed correctly',
        screenshot: screenshot.toString('base64'),
        timestamp,
      };
    } catch (error) {
      return {
        testName,
        status: 'failed',
        message: `Empty state after search test failed: ${error.message}`,
        timestamp,
      };
    }
  }

  /**
   * Test empty state accessibility
   */
  async testEmptyStateAccessibility(): Promise<EmptyStateTestResult> {
    const testName = 'Empty State Accessibility';
    const timestamp = new Date().toISOString();

    try {
      // Mock empty API response
      await this.page.route('**/api/analytics/players**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            metadata: {
              total: 0,
              page: 1,
              limit: 50,
              hasMore: false,
              lastUpdated: new Date().toISOString(),
            },
          }),
        });
      });

      // Navigate to players section
      await this.page.goto('/analytics');
      await this.page.click('[data-testid="players-tab"]');

      // Wait for empty state to appear
      await expect(
        this.page.locator('[data-testid="empty-state"]')
      ).toBeVisible();

      // Check accessibility attributes
      const emptyState = this.page.locator('[data-testid="empty-state"]');
      await expect(emptyState).toHaveAttribute('role', 'status');
      await expect(emptyState).toHaveAttribute('aria-live', 'polite');

      // Check for proper heading structure
      await expect(
        this.page.locator('[data-testid="empty-state-title"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="empty-state-description"]')
      ).toBeVisible();

      // Check for focusable elements
      await expect(
        this.page.locator('[data-testid="clear-filters-button"]')
      ).toBeVisible();
      await expect(
        this.page.locator('[data-testid="refresh-button"]')
      ).toBeVisible();

      // Test keyboard navigation
      await this.page.keyboard.press('Tab');
      await this.page.keyboard.press('Tab');
      await this.page.keyboard.press('Enter');

      // Take screenshot
      const screenshot = await this.page.screenshot({
        path: `test-results/empty-states/accessibility-${Date.now()}.png`,
        fullPage: true,
      });

      return {
        testName,
        status: 'passed',
        message: 'Empty state accessibility features working correctly',
        screenshot: screenshot.toString('base64'),
        timestamp,
      };
    } catch (error) {
      return {
        testName,
        status: 'failed',
        message: `Empty state accessibility test failed: ${error.message}`,
        timestamp,
      };
    }
  }

  /**
   * Test empty state responsive design
   */
  async testEmptyStateResponsiveDesign(): Promise<EmptyStateTestResult> {
    const testName = 'Empty State Responsive Design';
    const timestamp = new Date().toISOString();

    try {
      // Mock empty API response
      await this.page.route('**/api/analytics/players**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            metadata: {
              total: 0,
              page: 1,
              limit: 50,
              hasMore: false,
              lastUpdated: new Date().toISOString(),
            },
          }),
        });
      });

      // Test different viewport sizes
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

        // Navigate to players section
        await this.page.goto('/analytics');
        await this.page.click('[data-testid="players-tab"]');

        // Wait for empty state to appear
        await expect(
          this.page.locator('[data-testid="empty-state"]')
        ).toBeVisible();

        // Take screenshot for each viewport
        await this.page.screenshot({
          path: `test-results/empty-states/responsive-${viewport.name}-${Date.now()}.png`,
          fullPage: true,
        });
      }

      return {
        testName,
        status: 'passed',
        message:
          'Empty state responsive design working correctly across all viewports',
        timestamp,
      };
    } catch (error) {
      return {
        testName,
        status: 'failed',
        message: `Empty state responsive design test failed: ${error.message}`,
        timestamp,
      };
    }
  }

  /**
   * Run all empty state tests
   */
  async runAllEmptyStateTests(): Promise<EmptyStateTestResult[]> {
    const tests = [
      this.testEmptyPlayersState,
      this.testEmptyClubsState,
      this.testEmptyTournamentsState,
      this.testEmptyStateAfterFiltering,
      this.testEmptyStateAfterSearch,
      this.testEmptyStateAccessibility,
      this.testEmptyStateResponsiveDesign,
    ];

    const results: EmptyStateTestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test.call(this);
        results.push(result);
        console.log(
          `${result.status === 'passed' ? '✅' : '❌'} ${result.testName}: ${result.message}`
        );
      } catch (error) {
        results.push({
          testName: test.name,
          status: 'failed',
          message: `Test execution failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        });
        console.log(`❌ ${test.name}: Test execution failed`);
      }
    }

    return results;
  }

  /**
   * Generate empty state test report
   */
  generateReport(results: EmptyStateTestResult[]): string {
    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const total = results.length;
    const passRate = (passed / total) * 100;

    return `
Empty State Test Report
======================

Summary:
- Total Tests: ${total}
- Passed: ${passed}
- Failed: ${failed}
- Pass Rate: ${passRate.toFixed(2)}%

Results:
${results
  .map(
    (result) => `
${result.status === 'passed' ? '✅' : '❌'} ${result.testName}
   Status: ${result.status.toUpperCase()}
   Message: ${result.message}
   Timestamp: ${result.timestamp}
`
  )
  .join('')}

Generated: ${new Date().toISOString()}
`;
  }
}
