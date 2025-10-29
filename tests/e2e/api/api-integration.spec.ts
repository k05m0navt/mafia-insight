import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to API testing page
    await page.goto('/api-testing');
    await expect(
      page.locator('[data-testid="api-testing-page"]')
    ).toBeVisible();
  });

  test('should test authentication API endpoints', async ({ page }) => {
    // Test login endpoint
    await page.click('[data-testid="test-login-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );

    // Test logout endpoint
    await page.click('[data-testid="test-logout-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );

    // Test token refresh endpoint
    await page.click('[data-testid="test-refresh-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
  });

  test('should test analytics API endpoints', async ({ page }) => {
    // Test player stats endpoint
    await page.click('[data-testid="test-player-stats-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );

    // Test club stats endpoint
    await page.click('[data-testid="test-club-stats-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );

    // Test tournament stats endpoint
    await page.click('[data-testid="test-tournament-stats-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
  });

  test('should test import API endpoints', async ({ page }) => {
    // Test import start endpoint
    await page.click('[data-testid="test-import-start-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '202'
    );

    // Test import status endpoint
    await page.click('[data-testid="test-import-status-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );

    // Test import logs endpoint
    await page.click('[data-testid="test-import-logs-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
  });

  test('should test data synchronization API endpoints', async ({ page }) => {
    // Test sync status endpoint
    await page.click('[data-testid="test-sync-status-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );

    // Test sync start endpoint
    await page.click('[data-testid="test-sync-start-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '202'
    );

    // Test sync history endpoint
    await page.click('[data-testid="test-sync-history-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
  });

  test('should test error handling in API responses', async ({ page }) => {
    // Test 400 error
    await page.click('[data-testid="test-400-error-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '400'
    );
    await expect(
      page.locator('[data-testid="api-error-message"]')
    ).toBeVisible();

    // Test 401 error
    await page.click('[data-testid="test-401-error-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '401'
    );
    await expect(
      page.locator('[data-testid="api-error-message"]')
    ).toBeVisible();

    // Test 500 error
    await page.click('[data-testid="test-500-error-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '500'
    );
    await expect(
      page.locator('[data-testid="api-error-message"]')
    ).toBeVisible();
  });

  test('should test API rate limiting', async ({ page }) => {
    // Make multiple rapid requests to trigger rate limiting
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="test-rate-limit-api"]');
      await page.waitForTimeout(100);
    }

    // Check for rate limit response
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '429'
    );
    await expect(
      page.locator('[data-testid="rate-limit-message"]')
    ).toBeVisible();
  });

  test('should test API authentication and authorization', async ({ page }) => {
    // Test with valid token
    await page.fill('[data-testid="api-token-input"]', 'valid-token');
    await page.click('[data-testid="test-authenticated-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );

    // Test with invalid token
    await page.fill('[data-testid="api-token-input"]', 'invalid-token');
    await page.click('[data-testid="test-authenticated-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '401'
    );

    // Test with expired token
    await page.fill('[data-testid="api-token-input"]', 'expired-token');
    await page.click('[data-testid="test-authenticated-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '401'
    );
  });

  test('should test API request/response validation', async ({ page }) => {
    // Test valid request
    await page.fill(
      '[data-testid="api-request-body"]',
      JSON.stringify({
        name: 'Test Player',
        email: 'test@example.com',
        rating: 1500,
      })
    );
    await page.click('[data-testid="test-validation-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );

    // Test invalid request
    await page.fill(
      '[data-testid="api-request-body"]',
      JSON.stringify({
        name: '',
        email: 'invalid-email',
        rating: -100,
      })
    );
    await page.click('[data-testid="test-validation-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '400'
    );
    await expect(
      page.locator('[data-testid="validation-errors"]')
    ).toBeVisible();
  });

  test('should test API performance and response times', async ({ page }) => {
    // Test response time measurement
    await page.click('[data-testid="test-performance-api"]');
    await expect(
      page.locator('[data-testid="api-response-time"]')
    ).toBeVisible();

    const responseTime = await page
      .locator('[data-testid="api-response-time"]')
      .textContent();
    const time = parseInt(responseTime?.replace('ms', '') || '0');
    expect(time).toBeLessThan(1000); // Should respond within 1 second
  });

  test('should test API data consistency', async ({ page }) => {
    // Test data consistency across multiple requests
    await page.click('[data-testid="test-consistency-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();

    // Make another request to verify consistency
    await page.click('[data-testid="test-consistency-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();

    // Check that responses are consistent
    await expect(
      page.locator('[data-testid="consistency-indicator"]')
    ).toContainText('Consistent');
  });

  test('should test API caching behavior', async ({ page }) => {
    // Test cache hit
    await page.click('[data-testid="test-cache-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="cache-status"]')).toContainText(
      'Hit'
    );

    // Test cache miss
    await page.click('[data-testid="clear-cache-button"]');
    await page.click('[data-testid="test-cache-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="cache-status"]')).toContainText(
      'Miss'
    );
  });

  test('should test API pagination', async ({ page }) => {
    // Test pagination parameters
    await page.fill('[data-testid="page-input"]', '1');
    await page.fill('[data-testid="limit-input"]', '10');
    await page.click('[data-testid="test-pagination-api"]');

    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="pagination-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-count"]')).toBeVisible();
  });

  test('should test API filtering and sorting', async ({ page }) => {
    // Test filtering
    await page.fill('[data-testid="filter-input"]', 'rating>1500');
    await page.click('[data-testid="test-filter-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="filtered-results"]')
    ).toBeVisible();

    // Test sorting
    await page.fill('[data-testid="sort-input"]', 'rating:desc');
    await page.click('[data-testid="test-sort-api"]');
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="sorted-results"]')).toBeVisible();
  });

  test('should test API batch operations', async ({ page }) => {
    // Test batch create
    await page.fill(
      '[data-testid="batch-data-input"]',
      JSON.stringify([
        { name: 'Player 1', email: 'player1@example.com', rating: 1500 },
        { name: 'Player 2', email: 'player2@example.com', rating: 1600 },
      ])
    );
    await page.click('[data-testid="test-batch-create-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '201'
    );
    await expect(page.locator('[data-testid="batch-results"]')).toBeVisible();

    // Test batch update
    await page.click('[data-testid="test-batch-update-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="batch-results"]')).toBeVisible();

    // Test batch delete
    await page.click('[data-testid="test-batch-delete-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="batch-results"]')).toBeVisible();
  });

  test('should test API webhook notifications', async ({ page }) => {
    // Test webhook registration
    await page.fill(
      '[data-testid="webhook-url-input"]',
      'https://example.com/webhook'
    );
    await page.click('[data-testid="test-webhook-register-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '201'
    );
    await expect(page.locator('[data-testid="webhook-id"]')).toBeVisible();

    // Test webhook trigger
    await page.click('[data-testid="test-webhook-trigger-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="webhook-status"]')).toContainText(
      'Sent'
    );
  });

  test('should test API versioning', async ({ page }) => {
    // Test v1 API
    await page.selectOption('[data-testid="api-version-select"]', 'v1');
    await page.click('[data-testid="test-versioned-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="api-version"]')).toContainText(
      'v1'
    );

    // Test v2 API
    await page.selectOption('[data-testid="api-version-select"]', 'v2');
    await page.click('[data-testid="test-versioned-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="api-version"]')).toContainText(
      'v2'
    );
  });

  test('should test API monitoring and health checks', async ({ page }) => {
    // Test health check endpoint
    await page.click('[data-testid="test-health-check-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="health-status"]')).toContainText(
      'Healthy'
    );

    // Test metrics endpoint
    await page.click('[data-testid="test-metrics-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="metrics-data"]')).toBeVisible();

    // Test status endpoint
    await page.click('[data-testid="test-status-api"]');
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      '200'
    );
    await expect(page.locator('[data-testid="status-data"]')).toBeVisible();
  });
});
