import { Page, BrowserContext } from '@playwright/test';
import { AnalyticsDataGenerator } from '../data/analytics/AnalyticsDataGenerator';

export class AnalyticsTestSetup {
  constructor(
    private page: Page,
    private context: BrowserContext
  ) {}

  /**
   * Setup test environment for analytics testing
   */
  async setupTestEnvironment() {
    // Set up test database
    await this.setupTestDatabase();

    // Set up test data
    await this.setupTestData();

    // Set up mock APIs
    await this.setupMockAPIs();

    // Set up test user session
    await this.setupTestUserSession();
  }

  /**
   * Setup test database with analytics data
   */
  private async setupTestDatabase() {
    // This would typically involve:
    // 1. Connect to test database
    // 2. Run migrations
    // 3. Seed with test data
    // 4. Set up test user accounts

    console.log('Setting up test database...');

    // Mock database setup
    await this.page.evaluate(() => {
      // Simulate database setup
      localStorage.setItem('test-db-setup', 'complete');
    });
  }

  /**
   * Setup test data for analytics
   */
  private async setupTestData() {
    console.log('Setting up test data...');

    // Generate test data
    const players = AnalyticsDataGenerator.generatePlayers(100);
    const clubs = AnalyticsDataGenerator.generateClubs(20);
    const tournaments = AnalyticsDataGenerator.generateTournaments(50);

    // Store in test context
    await this.context.addInitScript(
      (data) => {
        (window as Record<string, unknown>).testData = data;
      },
      { players, clubs, tournaments }
    );
  }

  /**
   * Setup mock APIs for analytics
   */
  private async setupMockAPIs() {
    console.log('Setting up mock APIs...');

    // Mock analytics overview API
    await this.page.route('**/api/analytics/overview', async (route) => {
      const overviewData = AnalyticsDataGenerator.generateOverviewData();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(overviewData),
      });
    });

    // Mock players API
    await this.page.route('**/api/analytics/players**', async (route) => {
      const players = AnalyticsDataGenerator.generatePlayers(50);
      const response = {
        data: players,
        metadata: {
          total: players.length,
          page: 1,
          limit: 50,
          hasMore: false,
          lastUpdated: new Date().toISOString(),
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Mock clubs API
    await this.page.route('**/api/analytics/clubs**', async (route) => {
      const clubs = AnalyticsDataGenerator.generateClubs(20);
      const response = {
        data: clubs,
        metadata: {
          total: clubs.length,
          page: 1,
          limit: 20,
          hasMore: false,
          lastUpdated: new Date().toISOString(),
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Mock tournaments API
    await this.page.route('**/api/analytics/tournaments**', async (route) => {
      const tournaments = AnalyticsDataGenerator.generateTournaments(30);
      const response = {
        data: tournaments,
        metadata: {
          total: tournaments.length,
          page: 1,
          limit: 30,
          hasMore: false,
          lastUpdated: new Date().toISOString(),
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Mock leaderboard API
    await this.page.route('**/api/analytics/leaderboard**', async (route) => {
      const leaderboard = AnalyticsDataGenerator.generateLeaderboard(20);
      const response = {
        data: leaderboard,
        metadata: {
          total: leaderboard.length,
          page: 1,
          limit: 20,
          hasMore: false,
          lastUpdated: new Date().toISOString(),
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    // Mock export API
    await this.page.route('**/api/analytics/export**', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Simulate export processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = {
        success: true,
        downloadUrl: `/downloads/export_${Date.now()}.${postData.format}`,
        filename: `analytics_export.${postData.format}`,
        size: 1024 * 1024, // 1MB
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Setup test user session
   */
  private async setupTestUserSession() {
    console.log('Setting up test user session...');

    // Mock authentication
    await this.page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token-123');
      localStorage.setItem('user-id', 'test-user-123');
      localStorage.setItem('user-role', 'admin');
    });
  }

  /**
   * Setup specific test scenario
   */
  async setupScenario(scenario: string) {
    switch (scenario) {
      case 'empty-data':
        await this.setupEmptyDataScenario();
        break;
      case 'large-dataset':
        await this.setupLargeDatasetScenario();
        break;
      case 'error-scenario':
        await this.setupErrorScenario();
        break;
      case 'slow-network':
        await this.setupSlowNetworkScenario();
        break;
      case 'filtered-data':
        await this.setupFilteredDataScenario();
        break;
      default:
        await this.setupDefaultScenario();
    }
  }

  /**
   * Setup empty data scenario
   */
  private async setupEmptyDataScenario() {
    await this.page.route('**/api/analytics/**', async (route) => {
      const response = {
        data: [],
        metadata: {
          total: 0,
          page: 1,
          limit: 50,
          hasMore: false,
          lastUpdated: new Date().toISOString(),
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Setup large dataset scenario
   */
  private async setupLargeDatasetScenario() {
    const largePlayers = AnalyticsDataGenerator.generatePlayers(1000);
    const largeClubs = AnalyticsDataGenerator.generateClubs(100);
    const largeTournaments = AnalyticsDataGenerator.generateTournaments(500);

    await this.context.addInitScript(
      (data) => {
        (window as Record<string, unknown>).largeTestData = data;
      },
      {
        players: largePlayers,
        clubs: largeClubs,
        tournaments: largeTournaments,
      }
    );
  }

  /**
   * Setup error scenario
   */
  private async setupErrorScenario() {
    await this.page.route('**/api/analytics/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Database connection failed',
          timestamp: new Date().toISOString(),
        }),
      });
    });
  }

  /**
   * Setup slow network scenario
   */
  private async setupSlowNetworkScenario() {
    await this.page.route('**/api/analytics/**', async (route) => {
      // Simulate slow network (3 second delay)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const data = AnalyticsDataGenerator.generatePlayers(50);
      const response = {
        data,
        metadata: {
          total: data.length,
          page: 1,
          limit: 50,
          hasMore: false,
          lastUpdated: new Date().toISOString(),
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Setup filtered data scenario
   */
  private async setupFilteredDataScenario() {
    await this.page.route('**/api/analytics/players**', async (route) => {
      const url = new URL(route.request().url());
      const filters = url.searchParams.get('filters');

      let players = AnalyticsDataGenerator.generatePlayers(50);

      if (filters) {
        const filterObj = JSON.parse(filters);
        players = AnalyticsDataGenerator.generateFilteredData(
          'players',
          filterObj,
          50
        );
      }

      const response = {
        data: players,
        metadata: {
          total: players.length,
          page: 1,
          limit: 50,
          hasMore: false,
          lastUpdated: new Date().toISOString(),
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Setup default scenario
   */
  private async setupDefaultScenario() {
    // Use the default mock APIs setup
    await this.setupMockAPIs();
  }

  /**
   * Cleanup test environment
   */
  async cleanup() {
    console.log('Cleaning up test environment...');

    // Clear test data
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear mock routes
    await this.page.unrouteAll();

    // Clear test context
    await this.context.clearCookies();
  }

  /**
   * Reset to default state
   */
  async reset() {
    await this.cleanup();
    await this.setupTestEnvironment();
  }

  /**
   * Setup performance monitoring
   */
  async setupPerformanceMonitoring() {
    await this.page.evaluate(() => {
      // Set up performance monitoring
      (window as Record<string, unknown>).performanceMetrics = {
        startTime: Date.now(),
        requests: [],
        errors: [],
      };

      // Monitor fetch requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = Date.now();
        try {
          const response = await originalFetch(...args);
          const endTime = Date.now();

          (
            (window as Record<string, unknown>).performanceMetrics as Record<
              string,
              unknown
            >
          ).requests.push({
            url: args[0],
            method: args[1]?.method || 'GET',
            duration: endTime - startTime,
            status: response.status,
            timestamp: new Date().toISOString(),
          });

          return response;
        } catch (error) {
          const endTime = Date.now();

          (
            (window as Record<string, unknown>).performanceMetrics as Record<
              string,
              unknown
            >
          ).errors.push({
            url: args[0],
            method: args[1]?.method || 'GET',
            duration: endTime - startTime,
            error: error.message,
            timestamp: new Date().toISOString(),
          });

          throw error;
        }
      };
    });
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      return (window as Record<string, unknown>).performanceMetrics || null;
    });
  }
}
