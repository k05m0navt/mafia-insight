import { test, expect } from '@playwright/test';
import { ApiTestUtils } from '../../utils/api/ApiTestUtils';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('API Authentication Testing', () => {
  test.beforeEach(async ({ page }) => {
    await ApiTestUtils.navigateToApiTestingPage(page);
  });

  test('should authenticate with valid token', async ({ page }) => {
    await testLogger.info('Testing valid token authentication');

    await ApiTestUtils.setAuthToken(page, 'valid-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('Valid token authentication test passed');
  });

  test('should reject invalid token', async ({ page }) => {
    await testLogger.info('Testing invalid token rejection');

    await ApiTestUtils.setAuthToken(page, 'invalid-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 401);
    await expect(
      page.locator('[data-testid="error-unauthorized"]')
    ).toBeVisible();

    await testLogger.info('Invalid token rejection test passed');
  });

  test('should reject expired token', async ({ page }) => {
    await testLogger.info('Testing expired token rejection');

    await ApiTestUtils.setAuthToken(page, 'expired-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 401);
    await expect(
      page.locator('[data-testid="error-token-expired"]')
    ).toBeVisible();

    await testLogger.info('Expired token rejection test passed');
  });

  test('should reject request without token', async ({ page }) => {
    await testLogger.info('Testing request without token');

    await ApiTestUtils.clearAuthToken(page);
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 401);
    await expect(page.locator('[data-testid="error-no-token"]')).toBeVisible();

    await testLogger.info('No token rejection test passed');
  });

  test('should handle malformed token', async ({ page }) => {
    await testLogger.info('Testing malformed token handling');

    await ApiTestUtils.setAuthToken(page, 'malformed.token.here');
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 401);
    await expect(
      page.locator('[data-testid="error-malformed-token"]')
    ).toBeVisible();

    await testLogger.info('Malformed token handling test passed');
  });

  test('should handle token in Authorization header', async ({ page }) => {
    await testLogger.info('Testing Authorization header token');

    await ApiTestUtils.setRequestHeaders(page, {
      Authorization: 'Bearer valid-token',
    });
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('Authorization header token test passed');
  });

  test('should handle token in custom header', async ({ page }) => {
    await testLogger.info('Testing custom header token');

    await ApiTestUtils.setRequestHeaders(page, {
      'X-API-Token': 'valid-token',
    });
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('Custom header token test passed');
  });

  test('should handle API key authentication', async ({ page }) => {
    await testLogger.info('Testing API key authentication');

    await ApiTestUtils.setRequestHeaders(page, {
      'X-API-Key': 'valid-api-key',
    });
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('API key authentication test passed');
  });

  test('should handle OAuth2 authentication', async ({ page }) => {
    await testLogger.info('Testing OAuth2 authentication');

    await ApiTestUtils.setRequestHeaders(page, {
      Authorization: 'Bearer oauth2-token',
    });
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('OAuth2 authentication test passed');
  });

  test('should validate token expiration time', async ({ page }) => {
    await testLogger.info('Testing token expiration validation');

    await ApiTestUtils.setAuthToken(page, 'expires-soon-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await expect(
      page.locator('[data-testid="token-expiry-warning"]')
    ).toBeVisible();

    await testLogger.info('Token expiration validation test passed');
  });

  test('should refresh expired tokens', async ({ page }) => {
    await testLogger.info('Testing token refresh');

    await ApiTestUtils.setAuthToken(page, 'expired-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');

    // Check for refresh token in response
    await expect(page.locator('[data-testid="refresh-token"]')).toBeVisible();

    await testLogger.info('Token refresh test passed');
  });

  test('should revoke tokens', async ({ page }) => {
    await testLogger.info('Testing token revocation');

    await ApiTestUtils.setAuthToken(page, 'revoked-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 401);
    await expect(
      page.locator('[data-testid="error-token-revoked"]')
    ).toBeVisible();

    await testLogger.info('Token revocation test passed');
  });

  test('should handle concurrent requests with same token', async ({
    page,
  }) => {
    await testLogger.info('Testing concurrent requests with same token');

    await ApiTestUtils.setAuthToken(page, 'valid-token');
    await ApiTestUtils.testConcurrentRequests(page, '/api/protected', 5);

    await testLogger.info('Concurrent requests test passed');
  });

  test('should validate token signature', async ({ page }) => {
    await testLogger.info('Testing token signature validation');

    await ApiTestUtils.setAuthToken(page, 'modified-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');
    await ApiTestUtils.verifyApiResponse(page, 401);
    await expect(
      page.locator('[data-testid="error-invalid-signature"]')
    ).toBeVisible();

    await testLogger.info('Token signature validation test passed');
  });

  test('should handle role-based authorization', async ({ page }) => {
    await testLogger.info('Testing role-based authorization');

    // Test user token
    await ApiTestUtils.setAuthToken(page, 'user-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/admin');
    await ApiTestUtils.verifyApiResponse(page, 403);

    // Test admin token
    await ApiTestUtils.setAuthToken(page, 'admin-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/admin');
    await ApiTestUtils.verifyApiResponse(page, 200);

    await testLogger.info('Role-based authorization test passed');
  });

  test('should handle permission-based authorization', async ({ page }) => {
    await testLogger.info('Testing permission-based authorization');

    // Test with read-only permissions
    await ApiTestUtils.setAuthToken(page, 'read-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/players', 'GET');
    await ApiTestUtils.verifyApiResponse(page, 200);

    await ApiTestUtils.testApiEndpoint(page, '/api/players', 'POST', {});
    await ApiTestUtils.verifyApiResponse(page, 403);

    await testLogger.info('Permission-based authorization test passed');
  });

  test('should log authentication attempts', async ({ page }) => {
    await testLogger.info('Testing authentication logging');

    await ApiTestUtils.setAuthToken(page, 'valid-token');
    await ApiTestUtils.testApiEndpoint(page, '/api/protected');

    // Check that authentication was logged
    await expect(page.locator('[data-testid="auth-log"]')).toBeVisible();

    await testLogger.info('Authentication logging test passed');
  });

  test('should implement rate limiting on auth endpoints', async ({ page }) => {
    await testLogger.info('Testing rate limiting on auth endpoints');

    // Try to login multiple times rapidly
    for (let i = 0; i < 10; i++) {
      await ApiTestUtils.testApiEndpoint(page, '/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password',
      });
      await page.waitForTimeout(100);
    }

    await ApiTestUtils.verifyApiResponse(page, 429);

    await testLogger.info('Rate limiting test passed');
  });
});
