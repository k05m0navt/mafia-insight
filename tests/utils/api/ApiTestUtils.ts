import { Page, expect } from '@playwright/test';

export class ApiTestUtils {
  static async navigateToApiTestingPage(page: Page) {
    await page.goto('/api-testing');
    await expect(
      page.locator('[data-testid="api-testing-page"]')
    ).toBeVisible();
  }

  static async testApiEndpoint(
    page: Page,
    endpoint: string,
    method: string = 'GET',
    data?: unknown
  ) {
    // Select endpoint
    await page.selectOption('[data-testid="endpoint-select"]', endpoint);

    // Select method
    await page.selectOption('[data-testid="method-select"]', method);

    // Fill request body if provided
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      await page.fill(
        '[data-testid="request-body-input"]',
        JSON.stringify(data, null, 2)
      );
    }

    // Execute request
    await page.click('[data-testid="execute-request-button"]');

    // Wait for response
    await expect(page.locator('[data-testid="api-response"]')).toBeVisible();
  }

  static async verifyApiResponse(
    page: Page,
    expectedStatus: number,
    expectedData?: unknown
  ) {
    // Check status code
    await expect(page.locator('[data-testid="api-status"]')).toContainText(
      String(expectedStatus)
    );

    // Check response data if provided
    if (expectedData) {
      const responseText = await page
        .locator('[data-testid="api-response"]')
        .textContent();
      const responseData = JSON.parse(responseText || '{}');
      expect(responseData).toMatchObject(expectedData);
    }
  }

  static async verifyApiError(page: Page, expectedError: string) {
    await expect(
      page.locator('[data-testid="api-error-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="api-error-message"]')
    ).toContainText(expectedError);
  }

  static async setAuthToken(page: Page, token: string) {
    await page.fill('[data-testid="api-token-input"]', token);
  }

  static async clearAuthToken(page: Page) {
    await page.fill('[data-testid="api-token-input"]', '');
  }

  static async setRequestHeaders(page: Page, headers: Record<string, string>) {
    for (const [key, value] of Object.entries(headers)) {
      await page.fill(
        `[data-testid="header-${key.toLowerCase()}-input"]`,
        value
      );
    }
  }

  static async setQueryParameters(page: Page, params: Record<string, string>) {
    for (const [key, value] of Object.entries(params)) {
      await page.fill(`[data-testid="query-${key}-input"]`, value);
    }
  }

  static async verifyResponseTime(page: Page, maxTime: number) {
    const responseTimeText = await page
      .locator('[data-testid="api-response-time"]')
      .textContent();
    const responseTime = parseInt(responseTimeText?.replace('ms', '') || '0');
    expect(responseTime).toBeLessThan(maxTime);
  }

  static async verifyResponseHeaders(
    page: Page,
    expectedHeaders: Record<string, string>
  ) {
    for (const [key, value] of Object.entries(expectedHeaders)) {
      await expect(
        page.locator(`[data-testid="response-header-${key.toLowerCase()}"]`)
      ).toContainText(value);
    }
  }

  static async verifyCacheHeaders(page: Page) {
    await expect(
      page.locator('[data-testid="response-header-cache-control"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="response-header-etag"]')
    ).toBeVisible();
  }

  static async testRateLimiting(
    page: Page,
    endpoint: string,
    maxRequests: number
  ) {
    // Make multiple rapid requests
    for (let i = 0; i < maxRequests + 1; i++) {
      await this.testApiEndpoint(page, endpoint);
      await page.waitForTimeout(100);
    }

    // Check for rate limit response
    await this.verifyApiResponse(page, 429);
    await expect(
      page.locator('[data-testid="rate-limit-message"]')
    ).toBeVisible();
  }

  static async testAuthentication(page: Page, endpoint: string) {
    // Test without token
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 401);

    // Test with invalid token
    await this.setAuthToken(page, 'invalid-token');
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 401);

    // Test with valid token
    await this.setAuthToken(page, 'valid-token');
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 200);
  }

  static async testRequestValidation(
    page: Page,
    endpoint: string,
    invalidData: unknown
  ) {
    await page.selectOption('[data-testid="method-select"]', 'POST');
    await page.fill(
      '[data-testid="request-body-input"]',
      JSON.stringify(invalidData, null, 2)
    );
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 400);
    await expect(
      page.locator('[data-testid="validation-errors"]')
    ).toBeVisible();
  }

  static async testPagination(page: Page, endpoint: string) {
    // Test first page
    await this.setQueryParameters(page, { page: '1', limit: '10' });
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 200);
    await expect(page.locator('[data-testid="pagination-info"]')).toBeVisible();

    // Test second page
    await this.setQueryParameters(page, { page: '2', limit: '10' });
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 200);
  }

  static async testFiltering(
    page: Page,
    endpoint: string,
    filters: Record<string, string>
  ) {
    await this.setQueryParameters(page, filters);
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 200);
    await expect(
      page.locator('[data-testid="filtered-results"]')
    ).toBeVisible();
  }

  static async testSorting(
    page: Page,
    endpoint: string,
    sortBy: string,
    order: string
  ) {
    await this.setQueryParameters(page, { sort: sortBy, order: order });
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 200);
    await expect(page.locator('[data-testid="sorted-results"]')).toBeVisible();
  }

  static async testBatchOperations(
    page: Page,
    endpoint: string,
    batchData: unknown[]
  ) {
    await page.selectOption('[data-testid="method-select"]', 'POST');
    await page.fill(
      '[data-testid="request-body-input"]',
      JSON.stringify({ items: batchData }, null, 2)
    );
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 201);
    await expect(page.locator('[data-testid="batch-results"]')).toBeVisible();
  }

  static async testWebhookRegistration(
    page: Page,
    webhookUrl: string,
    events: string[]
  ) {
    await page.selectOption('[data-testid="endpoint-select"]', '/api/webhooks');
    await page.selectOption('[data-testid="method-select"]', 'POST');
    await page.fill(
      '[data-testid="request-body-input"]',
      JSON.stringify(
        {
          url: webhookUrl,
          events: events,
        },
        null,
        2
      )
    );
    await this.testApiEndpoint(page, '/api/webhooks');
    await this.verifyApiResponse(page, 201);
    await expect(page.locator('[data-testid="webhook-id"]')).toBeVisible();
  }

  static async testApiVersioning(
    page: Page,
    endpoint: string,
    version: string
  ) {
    await this.setRequestHeaders(page, {
      Accept: `application/vnd.api+json;version=${version}`,
    });
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 200);
    await expect(page.locator('[data-testid="api-version"]')).toContainText(
      version
    );
  }

  static async testHealthCheck(page: Page) {
    await this.testApiEndpoint(page, '/api/health');
    await this.verifyApiResponse(page, 200);
    await expect(page.locator('[data-testid="health-status"]')).toContainText(
      'Healthy'
    );
  }

  static async testMetrics(page: Page) {
    await this.testApiEndpoint(page, '/api/metrics');
    await this.verifyApiResponse(page, 200);
    await expect(page.locator('[data-testid="metrics-data"]')).toBeVisible();
  }

  static async testConcurrentRequests(
    page: Page,
    endpoint: string,
    count: number
  ) {
    const requests = Array(count)
      .fill(null)
      .map(async () => {
        await this.testApiEndpoint(page, endpoint);
      });

    await Promise.all(requests);

    // Verify all requests completed
    await expect(
      page.locator('[data-testid="concurrent-requests-completed"]')
    ).toBeVisible();
  }

  static async testErrorHandling(
    page: Page,
    endpoint: string,
    errorType: string
  ) {
    await this.testApiEndpoint(page, endpoint);

    switch (errorType) {
      case '400':
        await this.verifyApiResponse(page, 400);
        break;
      case '401':
        await this.verifyApiResponse(page, 401);
        break;
      case '403':
        await this.verifyApiResponse(page, 403);
        break;
      case '404':
        await this.verifyApiResponse(page, 404);
        break;
      case '429':
        await this.verifyApiResponse(page, 429);
        break;
      case '500':
        await this.verifyApiResponse(page, 500);
        break;
    }
  }

  static async testCaching(page: Page, endpoint: string) {
    // First request
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 200);
    await this.verifyCacheHeaders(page);

    // Second request with cache
    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 200);
    await expect(page.locator('[data-testid="cache-status"]')).toContainText(
      'Hit'
    );
  }

  static async testDataConsistency(page: Page, endpoint: string) {
    // Make multiple requests to same endpoint
    await this.testApiEndpoint(page, endpoint);
    const firstResponse = await page
      .locator('[data-testid="api-response"]')
      .textContent();

    await this.testApiEndpoint(page, endpoint);
    const secondResponse = await page
      .locator('[data-testid="api-response"]')
      .textContent();

    // Verify responses are consistent
    expect(firstResponse).toBe(secondResponse);
    await expect(
      page.locator('[data-testid="consistency-indicator"]')
    ).toContainText('Consistent');
  }

  static async testPerformance(
    page: Page,
    endpoint: string,
    maxResponseTime: number
  ) {
    await this.testApiEndpoint(page, endpoint);
    await this.verifyResponseTime(page, maxResponseTime);
    await expect(
      page.locator('[data-testid="performance-indicator"]')
    ).toContainText('Good');
  }

  static async testSecurity(page: Page, endpoint: string) {
    // Test with various security headers
    await this.setRequestHeaders(page, {
      'X-Forwarded-For': '192.168.1.1',
      'User-Agent': 'Mozilla/5.0 (Test Browser)',
      Origin: 'https://example.com',
    });

    await this.testApiEndpoint(page, endpoint);
    await this.verifyApiResponse(page, 200);
    await expect(
      page.locator('[data-testid="security-headers"]')
    ).toBeVisible();
  }

  static async testApiDocumentation(page: Page) {
    await page.goto('/api/docs');
    await expect(
      page.locator('[data-testid="api-documentation"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="swagger-ui"]')).toBeVisible();
  }

  static async testApiSchema(page: Page) {
    await this.testApiEndpoint(page, '/api/schema');
    await this.verifyApiResponse(page, 200);
    await expect(page.locator('[data-testid="openapi-schema"]')).toBeVisible();
  }

  static async exportApiTestResults(page: Page, format: string) {
    await page.click(`[data-testid="export-${format}-button"]`);

    // Wait for download to start
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain(format);
  }

  static async verifyApiMonitoring(page: Page) {
    await expect(page.locator('[data-testid="api-monitoring"]')).toBeVisible();
    await expect(page.locator('[data-testid="request-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-count"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="average-response-time"]')
    ).toBeVisible();
  }

  static async testApiLoadBalancing(page: Page, endpoint: string) {
    // Make multiple requests to test load balancing
    const requests = Array(10)
      .fill(null)
      .map(async () => {
        await this.testApiEndpoint(page, endpoint);
      });

    await Promise.all(requests);

    // Check load balancing distribution
    await expect(
      page.locator('[data-testid="load-balance-distribution"]')
    ).toBeVisible();
  }

  static async testApiCircuitBreaker(page: Page, endpoint: string) {
    // Make requests to trigger circuit breaker
    for (let i = 0; i < 10; i++) {
      await this.testApiEndpoint(page, endpoint);
      await page.waitForTimeout(100);
    }

    // Check circuit breaker status
    await expect(
      page.locator('[data-testid="circuit-breaker-status"]')
    ).toBeVisible();
  }

  static async testApiRetry(page: Page, endpoint: string) {
    await this.testApiEndpoint(page, endpoint);
    await expect(page.locator('[data-testid="retry-attempts"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-delay"]')).toBeVisible();
  }

  static async testApiTimeout(page: Page, endpoint: string) {
    await this.testApiEndpoint(page, endpoint);
    await expect(
      page.locator('[data-testid="timeout-indicator"]')
    ).toBeVisible();
  }

  static async verifyApiAccessibility(page: Page) {
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Check ARIA labels
    await expect(
      page.locator('[data-testid="api-testing-page"]')
    ).toHaveAttribute('aria-label');
  }

  static async verifyApiResponsiveness(page: Page) {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.locator('[data-testid="api-testing-page"]')
    ).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(
      page.locator('[data-testid="api-testing-page"]')
    ).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(
      page.locator('[data-testid="api-testing-page"]')
    ).toBeVisible();
  }
}
