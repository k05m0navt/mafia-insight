import { Page } from '@playwright/test';
import { ApiTestUtils } from './ApiTestUtils';

export class ApiScenarios {
  static async testAuthenticationFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test login
    await ApiTestUtils.testApiEndpoint(page, '/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123',
    });
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test profile access
    await ApiTestUtils.setAuthToken(page, 'valid-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/auth/profile');
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test logout
    await ApiTestUtils.testApiEndpoint(page, '/api/auth/logout', 'POST');
    await ApiTestUtils.verifyApiResponse(page, 200);
  }

  static async testAnalyticsApiFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test player stats
    await ApiTestUtils.testApiEndpoint(
      page,
      '/api/analytics/players/123/stats'
    );
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test club stats
    await ApiTestUtils.testApiEndpoint(
      page,
      '/api/analytics/clubs/club-123/stats'
    );
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test tournament stats
    await ApiTestUtils.testApiEndpoint(
      page,
      '/api/analytics/tournaments/tourney-123/stats'
    );
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test dashboard
    await ApiTestUtils.testApiEndpoint(page, '/api/analytics/dashboard');
    await ApiTestUtils.verifyApiResponse(page, 200);
  }

  static async testImportApiFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test import start
    await ApiTestUtils.testApiEndpoint(page, '/api/import/start', 'POST', {
      source: 'gomafia',
      options: {
        batchSize: 100,
        concurrency: 5,
      },
    });
    await ApiTestUtils.verifyApiResponse(page, 202);

    // Test import status
    await ApiTestUtils.testApiEndpoint(page, '/api/import/status/import-123');
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test import logs
    await ApiTestUtils.testApiEndpoint(page, '/api/import/logs/import-123');
    await ApiTestUtils.verifyApiResponse(page, 200);
  }

  static async testDataSyncApiFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test sync status
    await ApiTestUtils.testApiEndpoint(page, '/api/sync/status');
    await ApiTestUtils.verifyApiResponse(page, 200);

    // Test sync start
    await ApiTestUtils.testApiEndpoint(page, '/api/sync/start', 'POST');
    await ApiTestUtils.verifyApiResponse(page, 202);

    // Test sync history
    await ApiTestUtils.testApiEndpoint(page, '/api/sync/history');
    await ApiTestUtils.verifyApiResponse(page, 200);
  }

  static async testErrorHandlingFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test 400 error
    await ApiTestUtils.testApiEndpoint(page, '/api/auth/login', 'POST', {
      email: 'invalid-email',
    });
    await ApiTestUtils.verifyApiResponse(page, 400);

    // Test 401 error
    await ApiTestUtils.testApiEndpoint(
      page,
      '/api/analytics/players/123/stats'
    );
    await ApiTestUtils.verifyApiResponse(page, 401);

    // Test 404 error
    await ApiTestUtils.testApiEndpoint(page, '/api/non-existent-endpoint');
    await ApiTestUtils.verifyApiResponse(page, 404);

    // Test 500 error
    await ApiTestUtils.testApiEndpoint(page, '/api/error-test');
    await ApiTestUtils.verifyApiResponse(page, 500);
  }

  static async testRateLimitingFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test rate limiting
    await ApiTestUtils.testRateLimiting(
      page,
      '/api/analytics/players/123/stats',
      10
    );
  }

  static async testAuthenticationFlowSecondary(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test authentication
    await ApiTestUtils.testAuthentication(
      page,
      '/api/analytics/players/123/stats'
    );
  }

  static async testRequestValidationFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test request validation
    await ApiTestUtils.testRequestValidation(page, '/api/players', {
      name: '',
      email: 'invalid-email',
      rating: -100,
    });
  }

  static async testPerformanceFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test performance
    await ApiTestUtils.testPerformance(
      page,
      '/api/analytics/players/123/stats',
      1000
    );
  }

  static async testDataConsistencyFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test data consistency
    await ApiTestUtils.testDataConsistency(
      page,
      '/api/analytics/players/123/stats'
    );
  }

  static async testCachingFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test caching
    await ApiTestUtils.testCaching(page, '/api/analytics/dashboard');
  }

  static async testPaginationFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test pagination
    await ApiTestUtils.testPagination(page, '/api/players');
  }

  static async testFilteringFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test filtering
    await ApiTestUtils.testFiltering(page, '/api/players', {
      rating_min: '1500',
      rating_max: '2000',
    });
  }

  static async testSortingFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test sorting
    await ApiTestUtils.testSorting(page, '/api/players', 'rating', 'desc');
  }

  static async testBatchOperationsFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test batch operations
    await ApiTestUtils.testBatchOperations(page, '/api/players/batch', [
      { name: 'Player 1', email: 'player1@example.com', rating: 1500 },
      { name: 'Player 2', email: 'player2@example.com', rating: 1600 },
    ]);
  }

  static async testWebhookFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test webhook registration
    await ApiTestUtils.testWebhookRegistration(
      page,
      'https://example.com/webhook',
      ['player.created', 'player.updated']
    );
  }

  static async testApiVersioningFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test API versioning
    await ApiTestUtils.testApiVersioning(page, '/api/players', 'v1');
    await ApiTestUtils.testApiVersioning(page, '/api/players', 'v2');
  }

  static async testHealthCheckFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test health check
    await ApiTestUtils.testHealthCheck(page);
  }

  static async testMetricsFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test metrics
    await ApiTestUtils.testMetrics(page);
  }

  static async testConcurrentRequestsFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test concurrent requests
    await ApiTestUtils.testConcurrentRequests(
      page,
      '/api/analytics/players/123/stats',
      5
    );
  }

  static async testErrorHandlingFlowSecondary(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test error handling
    await ApiTestUtils.testErrorHandling(page, '/api/error-400', '400');
    await ApiTestUtils.testErrorHandling(page, '/api/error-401', '401');
    await ApiTestUtils.testErrorHandling(page, '/api/error-403', '403');
    await ApiTestUtils.testErrorHandling(page, '/api/error-404', '404');
    await ApiTestUtils.testErrorHandling(page, '/api/error-429', '429');
    await ApiTestUtils.testErrorHandling(page, '/api/error-500', '500');
  }

  static async testSecurityFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test security
    await ApiTestUtils.testSecurity(page, '/api/analytics/players/123/stats');
  }

  static async testApiDocumentationFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test API documentation
    await ApiTestUtils.testApiDocumentation(page);
  }

  static async testApiSchemaFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test API schema
    await ApiTestUtils.testApiSchema(page);
  }

  static async testApiMonitoringFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test API monitoring
    await ApiTestUtils.verifyApiMonitoring(page);
  }

  static async testApiLoadBalancingFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test load balancing
    await ApiTestUtils.testApiLoadBalancing(
      page,
      '/api/analytics/players/123/stats'
    );
  }

  static async testApiCircuitBreakerFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test circuit breaker
    await ApiTestUtils.testApiCircuitBreaker(
      page,
      '/api/analytics/players/123/stats'
    );
  }

  static async testApiRetryFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test retry
    await ApiTestUtils.testApiRetry(page, '/api/analytics/players/123/stats');
  }

  static async testApiTimeoutFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);
    await ApiTestUtils.setAuthToken(page, 'valid-token');

    // Test timeout
    await ApiTestUtils.testApiTimeout(page, '/api/analytics/players/123/stats');
  }

  static async testApiAccessibilityFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test accessibility
    await ApiTestUtils.verifyApiAccessibility(page);
  }

  static async testApiResponsivenessFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test responsiveness
    await ApiTestUtils.verifyApiResponsiveness(page);
  }

  static async testApiExportFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test export functionality
    await ApiTestUtils.exportApiTestResults(page, 'json');
    await ApiTestUtils.exportApiTestResults(page, 'csv');
    await ApiTestUtils.exportApiTestResults(page, 'xml');
  }

  static async testApiEndToEndFlow(page: Page) {
    await ApiTestUtils.navigateToApiTestingPage(page);

    // Test complete API flow
    await this.testAuthenticationFlow(page);
    await this.testAnalyticsApiFlow(page);
    await this.testImportApiFlow(page);
    await this.testDataSyncApiFlow(page);
    await this.testErrorHandlingFlow(page);
    await this.testPerformanceFlow(page);
    await this.testCachingFlow(page);
    await this.testPaginationFlow(page);
    await this.testFilteringFlow(page);
    await this.testSortingFlow(page);
    await this.testBatchOperationsFlow(page);
    await this.testWebhookFlow(page);
    await this.testApiVersioningFlow(page);
    await this.testHealthCheckFlow(page);
    await this.testMetricsFlow(page);
    await this.testConcurrentRequestsFlow(page);
    await this.testSecurityFlow(page);
    await this.testApiDocumentationFlow(page);
    await this.testApiSchemaFlow(page);
    await this.testApiMonitoringFlow(page);
    await this.testApiLoadBalancingFlow(page);
    await this.testApiCircuitBreakerFlow(page);
    await this.testApiRetryFlow(page);
    await this.testApiTimeoutFlow(page);
    await this.testApiAccessibilityFlow(page);
    await this.testApiResponsivenessFlow(page);
    await this.testApiExportFlow(page);
  }
}
