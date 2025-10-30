import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Session Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle session expiration', async ({ page }) => {
    await testLogger.info('Testing session expiration');

    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.locator('[data-testid="login-button"]').click();

    // Simulate session expiration
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' }),
      });
    });

    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
    await expect(
      page.locator('[data-testid="session-expired-message"]')
    ).toBeVisible();
  });

  test('should handle session timeout', async ({ page }) => {
    await testLogger.info('Testing session timeout');

    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.locator('[data-testid="login-button"]').click();

    // Wait for timeout (simulate)
    await page.evaluate(() => {
      // Clear session storage to simulate timeout
      sessionStorage.clear();
      localStorage.removeItem('session');
    });

    await page.goto('/dashboard');

    await expect(page).toHaveURL('/login');
  });

  test('should handle invalid session token', async ({ page }) => {
    await testLogger.info('Testing invalid session token');

    await page.evaluate(() => {
      localStorage.setItem('token', 'invalid-token');
    });

    await page.goto('/dashboard');

    // Should show authentication error
    await expect(
      page.locator('[data-testid="invalid-session-error"]')
    ).toBeVisible();
  });

  test('should handle concurrent sessions', async ({ page, context }) => {
    await testLogger.info('Testing concurrent sessions');

    // Login in current page
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.locator('[data-testid="login-button"]').click();

    // Create new context (simulates different browser)
    const newContext = await context.browser()?.newContext();
    const newPage = await newContext?.newPage();

    if (newPage) {
      // Try to login in new context
      await newPage.goto('/login');
      await newPage.fill('[data-testid="email-input"]', 'test@example.com');
      await newPage.fill('[data-testid="password-input"]', 'password123');
      await newPage.locator('[data-testid="login-button"]').click();

      // Should handle concurrent session
      await expect(
        newPage.locator('[data-testid="concurrent-session-warning"]')
      ).toBeVisible();

      await newContext?.close();
    }
  });

  test('should handle session invalidation', async ({ page }) => {
    await testLogger.info('Testing session invalidation');

    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.locator('[data-testid="login-button"]').click();

    // Simulate session invalidation
    await page.route('**/api/auth/validate**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session invalidated' }),
      });
    });

    await page.goto('/dashboard');

    await expect(page).toHaveURL('/login');
  });

  test('should clear session on logout', async ({ page }) => {
    await testLogger.info('Testing session clearing');

    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.locator('[data-testid="login-button"]').click();

    // Logout
    await page.locator('[data-testid="logout-button"]').click();

    // Session should be cleared
    const hasToken = await page.evaluate(() => {
      return !!localStorage.getItem('token');
    });
    expect(hasToken).toBe(false);

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should handle session refresh', async ({ page }) => {
    await testLogger.info('Testing session refresh');

    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.locator('[data-testid="login-button"]').click();

    // Get initial token
    const initialToken = await page.evaluate(() => {
      return localStorage.getItem('token');
    });

    // Wait for session refresh
    await page.waitForTimeout(5000);

    // Get new token
    const newToken = await page.evaluate(() => {
      return localStorage.getItem('token');
    });

    // Tokens should be different (refreshed)
    expect(newToken).not.toBe(initialToken);
  });

  test('should handle session data loss', async ({ page }) => {
    await testLogger.info('Testing session data loss');

    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.locator('[data-testid="login-button"]').click();

    // Clear session data manually
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('user');
    });

    // Should handle gracefully
    await page.goto('/dashboard');

    // Should either restore or redirect to login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|login)/);
  });
});
