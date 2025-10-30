import { test, expect } from '@playwright/test';
import { ApiTestUtils } from '../../utils/api/ApiTestUtils';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('API Error Handling Testing', () => {
  test.beforeEach(async ({ page }) => {
    await ApiTestUtils.navigateToApiTestingPage(page);
  });

  test('should handle 400 Bad Request errors', async ({ page }) => {
    await testLogger.info('Testing 400 Bad Request errors');

    await ApiTestUtils.testErrorHandling(page, '/api/players', '400');
    await expect(
      page.locator('[data-testid="error-bad-request"]')
    ).toBeVisible();

    await testLogger.info('400 error handling test passed');
  });

  test('should handle 401 Unauthorized errors', async ({ page }) => {
    await testLogger.info('Testing 401 Unauthorized errors');

    // Test without authentication
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 401);
    await expect(
      page.locator('[data-testid="error-unauthorized"]')
    ).toBeVisible();

    await testLogger.info('401 error handling test passed');
  });

  test('should handle 403 Forbidden errors', async ({ page }) => {
    await testLogger.info('Testing 403 Forbidden errors');

    // Test with insufficient permissions
    await ApiTestUtils.setAuthToken(page, 'user-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/admin');
    await ApiTestUtils.verifyApiResponse(page, 403);
    await expect(page.locator('[data-testid="error-forbidden"]')).toBeVisible();

    await testLogger.info('403 error handling test passed');
  });

  test('should handle 404 Not Found errors', async ({ page }) => {
    await testLogger.info('Testing 404 Not Found errors');

    await ApiTestUtils.testErrorHandling(page, '/api/nonexistent', '404');
    await expect(page.locator('[data-testid="error-not-found"]')).toBeVisible();

    await testLogger.info('404 error handling test passed');
  });

  test('should handle 409 Conflict errors', async ({ page }) => {
    await testLogger.info('Testing 409 Conflict errors');

    // Try to create a duplicate resource
    await ApiTestUtils.testApiEndpoint(page, '/api/players', 'POST', {
      name: 'Duplicate Player',
      email: 'duplicate@example.com',
      rating: 1500,
    });
    await ApiTestUtils.verifyApiResponse(page, 409);
    await expect(page.locator('[data-testid="error-conflict"]')).toBeVisible();

    await testLogger.info('409 error handling test passed');
  });

  test('should handle 422 Unprocessable Entity errors', async ({ page }) => {
    await testLogger.info('Testing 422 Unprocessable Entity errors');

    // Send invalid data
    await ApiTestUtils.testApiEndpoint(page, '/api/players', 'POST', {
      name: '',
      email: 'invalid-email',
      rating: 'not-a-number',
    });
    await ApiTestUtils.verifyApiResponse(page, 422);
    await expect(
      page.locator('[data-testid="error-unprocessable"]')
    ).toBeVisible();

    await testLogger.info('422 error handling test passed');
  });

  test('should handle 429 Too Many Requests errors', async ({ page }) => {
    await testLogger.info('Testing 429 Too Many Requests errors');

    await ApiTestUtils.testRateLimiting(page, '/api/players', 10);

    await testLogger.info('429 error handling test passed');
  });

  test('should handle 500 Internal Server Error', async ({ page }) => {
    await testLogger.info('Testing 500 Internal Server Error');

    await ApiTestUtils.testErrorHandling(page, '/api/error', '500');
    await expect(
      page.locator('[data-testid="error-server-error"]')
    ).toBeVisible();

    await testLogger.info('500 error handling test passed');
  });

  test('should handle 502 Bad Gateway errors', async ({ page }) => {
    await testLogger.info('Testing 502 Bad Gateway errors');

    await ApiTestUtils.testErrorHandling(page, '/api/gateway', '502');
    await expect(
      page.locator('[data-testid="error-bad-gateway"]')
    ).toBeVisible();

    await testLogger.info('502 error handling test passed');
  });

  test('should handle 503 Service Unavailable errors', async ({ page }) => {
    await testLogger.info('Testing 503 Service Unavailable errors');

    await ApiTestUtils.testErrorHandling(page, '/api/service', '503');
    await expect(
      page.locator('[data-testid="error-service-unavailable"]')
    ).toBeVisible();

    await testLogger.info('503 error handling test passed');
  });

  test('should handle 504 Gateway Timeout errors', async ({ page }) => {
    await testLogger.info('Testing 504 Gateway Timeout errors');

    await ApiTestUtils.testApiTimeout(page, '/api/timeout');
    await expect(
      page.locator('[data-testid="error-gateway-timeout"]')
    ).toBeVisible();

    await testLogger.info('504 error handling test passed');
  });

  test('should provide detailed error messages', async ({ page }) => {
    await testLogger.info('Testing detailed error messages');

    await ApiTestUtils.testApiEndpoint(page, '/api/players', 'POST', {
      name: '',
      email: 'invalid',
    });

    const errorMessage = await page
      .locator('[data-testid="api-error-message"]')
      .textContent();
    expect(errorMessage).toContain('validation');
    expect(errorMessage).toContain('field');

    await testLogger.info('Detailed error messages test passed');
  });

  test('should include error codes in responses', async ({ page }) => {
    await testLogger.info('Testing error codes in responses');

    await ApiTestUtils.testApiEndpoint(page, '/api/error');
    await expect(page.locator('[data-testid="error-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-timestamp"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="error-request-id"]')
    ).toBeVisible();

    await testLogger.info('Error codes test passed');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await testLogger.info('Testing network error handling');

    // Mock network failure
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await ApiTestUtils.testApiEndpoint(page, '/api/players');
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();

    await testLogger.info('Network error handling test passed');
  });

  test('should handle timeout errors', async ({ page }) => {
    await testLogger.info('Testing timeout error handling');

    // Mock slow response
    await page.route('**/api/timeout', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      route.continue();
    });

    await ApiTestUtils.testApiTimeout(page, '/api/timeout');

    await testLogger.info('Timeout error handling test passed');
  });

  test('should handle malformed JSON responses', async ({ page }) => {
    await testLogger.info('Testing malformed JSON handling');

    // Mock malformed response
    await page.route('**/api/malformed', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{ invalid json }',
      });
    });

    await ApiTestUtils.testApiEndpoint(page, '/api/malformed');
    await expect(page.locator('[data-testid="json-error"]')).toBeVisible();

    await testLogger.info('Malformed JSON handling test passed');
  });

  test('should handle empty responses', async ({ page }) => {
    await testLogger.info('Testing empty response handling');

    // Mock empty response
    await page.route('**/api/empty', (route) => {
      route.fulfill({
        status: 200,
        body: '',
      });
    });

    await ApiTestUtils.testApiEndpoint(page, '/api/empty');
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('Empty response handling test passed');
  });
});
