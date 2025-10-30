import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Authentication - Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    await testLogger.info('Logged in before test', {
      url: page.url(),
      timestamp: new Date().toISOString(),
    });
  });

  test('should logout successfully from user menu', async ({ page }) => {
    // Click on user menu
    await page.click('[data-testid="user-menu"]');

    // Check that logout option is visible
    await expect(page.locator('[data-testid="logout-option"]')).toBeVisible();

    // Click logout
    await page.click('[data-testid="logout-option"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Check that user menu is no longer visible
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();

    // Check that login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    await testLogger.info('Logout from user menu test passed', {
      test: 'should logout successfully from user menu',
    });
  });

  test('should logout successfully from logout button', async ({ page }) => {
    // Click on logout button (if it exists as a separate button)
    await page.click('[data-testid="logout-button"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Check that user menu is no longer visible
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();

    // Check that login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    await testLogger.info('Logout from button test passed', {
      test: 'should logout successfully from logout button',
    });
  });

  test('should show confirmation dialog before logout', async ({ page }) => {
    // Click on user menu
    await page.click('[data-testid="user-menu"]');

    // Click logout
    await page.click('[data-testid="logout-option"]');

    // Check that confirmation dialog is shown
    await expect(
      page.locator('[data-testid="logout-confirmation-dialog"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="logout-confirmation-dialog"]')
    ).toContainText('Are you sure you want to logout?');

    // Check that confirm and cancel buttons are present
    await expect(
      page.locator('[data-testid="logout-confirm-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="logout-cancel-button"]')
    ).toBeVisible();

    // Click cancel
    await page.click('[data-testid="logout-cancel-button"]');

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Click logout again
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Click confirm
    await page.click('[data-testid="logout-confirm-button"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    await testLogger.info('Logout confirmation dialog test passed', {
      test: 'should show confirmation dialog before logout',
    });
  });

  test('should clear user session data on logout', async ({ page }) => {
    // Check that user data is present before logout
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(
      'Welcome'
    );

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Try to access a protected page
    await page.goto('/dashboard');

    // Should be redirected back to login
    await expect(page).toHaveURL('/login');

    // Check that no user data is visible
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    await expect(
      page.locator('[data-testid="welcome-message"]')
    ).not.toBeVisible();

    await testLogger.info('Session data clearing test passed', {
      test: 'should clear user session data on logout',
    });
  });

  test('should handle logout with unsaved changes', async ({ page }) => {
    // Navigate to a page with form data
    await page.goto('/analytics/players');

    // Make some changes to a form (if applicable)
    await page.fill('[data-testid="search-input"]', 'test search');

    // Try to logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Check that unsaved changes warning is shown
    await expect(
      page.locator('[data-testid="unsaved-changes-warning"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="unsaved-changes-warning"]')
    ).toContainText('You have unsaved changes');

    // Check that save and discard options are present
    await expect(
      page.locator('[data-testid="save-changes-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="discard-changes-button"]')
    ).toBeVisible();

    // Click discard
    await page.click('[data-testid="discard-changes-button"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    await testLogger.info('Unsaved changes logout test passed', {
      test: 'should handle logout with unsaved changes',
    });
  });

  test('should logout automatically on session timeout', async ({ page }) => {
    // Mock session timeout by setting a short timeout
    await page.evaluate(() => {
      // Simulate session timeout after 1 second
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('session-timeout'));
      }, 1000);
    });

    // Wait for session timeout event
    await page.waitForEvent('session-timeout');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Check that session timeout message is shown
    await expect(
      page.locator('[data-testid="session-timeout-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="session-timeout-message"]')
    ).toContainText('Your session has expired');

    await testLogger.info('Session timeout logout test passed', {
      test: 'should logout automatically on session timeout',
    });
  });

  test('should handle logout with network errors', async ({ page }) => {
    // Mock network failure for logout API
    await page.route('**/api/auth/logout', (route) => {
      route.abort('failed');
    });

    // Try to logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Check that error message is shown
    await expect(page.locator('[data-testid="logout-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-error"]')).toContainText(
      'Failed to logout. Please try again.'
    );

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Retry logout
    await page.click('[data-testid="retry-logout-button"]');

    // Should succeed this time (remove the route mock)
    await page.unroute('**/api/auth/logout');
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    await testLogger.info('Network error logout test passed', {
      test: 'should handle logout with network errors',
    });
  });

  test('should show loading state during logout', async ({ page }) => {
    // Mock slow logout response
    await page.route('**/api/auth/logout', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Check that loading state is shown
    await expect(page.locator('[data-testid="logout-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="logout-option"]')).toBeDisabled();

    // Wait for logout to complete
    await expect(page).toHaveURL('/login');

    await testLogger.info('Loading state logout test passed', {
      test: 'should show loading state during logout',
    });
  });

  test('should redirect to login page after logout', async ({ page }) => {
    // Navigate to a specific page
    await page.goto('/analytics/tournaments');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Try to access the previous page
    await page.goto('/analytics/tournaments');

    // Should be redirected back to login
    await expect(page).toHaveURL('/login');

    await testLogger.info('Redirect after logout test passed', {
      test: 'should redirect to login page after logout',
    });
  });

  test('should clear all browser storage on logout', async ({ page }) => {
    // Set some data in localStorage and sessionStorage
    await page.evaluate(() => {
      localStorage.setItem('test-data', 'test-value');
      sessionStorage.setItem('session-data', 'session-value');
    });

    // Verify data is set
    const localStorageData = await page.evaluate(() =>
      localStorage.getItem('test-data')
    );
    const sessionStorageData = await page.evaluate(() =>
      sessionStorage.getItem('session-data')
    );
    expect(localStorageData).toBe('test-value');
    expect(sessionStorageData).toBe('session-value');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Check that storage is cleared
    const clearedLocalStorage = await page.evaluate(() =>
      localStorage.getItem('test-data')
    );
    const clearedSessionStorage = await page.evaluate(() =>
      sessionStorage.getItem('session-data')
    );
    expect(clearedLocalStorage).toBeNull();
    expect(clearedSessionStorage).toBeNull();

    await testLogger.info('Storage clearing test passed', {
      test: 'should clear all browser storage on logout',
    });
  });

  test('should handle multiple logout attempts', async ({ page }) => {
    // Click logout multiple times rapidly
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');
    await page.click('[data-testid="logout-option"]');
    await page.click('[data-testid="logout-option"]');

    // Should only logout once
    await expect(page).toHaveURL('/login');

    // Should not be able to logout again
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login'); // Should be redirected back to login

    await testLogger.info('Multiple logout attempts test passed', {
      test: 'should handle multiple logout attempts',
    });
  });
});
