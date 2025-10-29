import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Authentication - Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
    await testLogger.info('Navigated to login page', {
      url: page.url(),
      timestamp: new Date().toISOString(),
    });
  });

  test('should display login form with required fields', async ({ page }) => {
    // Check that login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Check that email input is present
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
      'type',
      'email'
    );
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
      'required'
    );

    // Check that password input is present
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'password');
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('required');

    // Check that login button is present
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeEnabled();

    // Check that forgot password link is present
    await expect(
      page.locator('[data-testid="forgot-password-link"]')
    ).toBeVisible();

    // Check that signup link is present
    await expect(page.locator('[data-testid="signup-link"]')).toBeVisible();

    await testLogger.info('Login form validation passed', {
      test: 'should display login form with required fields',
    });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check that user menu is visible (indicating successful login)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Check that welcome message is displayed
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(
      'Welcome'
    );

    // Check that logout button is present
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();

    await testLogger.info('Successful login test passed', {
      test: 'should login successfully with valid credentials',
      email: 'test@example.com',
    });
  });

  test('should show error with invalid email format', async ({ page }) => {
    // Fill in invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Check that validation error is shown
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      'Please enter a valid email address'
    );

    // Check that we're still on login page
    await expect(page).toHaveURL('/login');

    await testLogger.info('Invalid email format test passed', {
      test: 'should show error with invalid email format',
    });
  });

  test('should show error with empty password', async ({ page }) => {
    // Fill in email but leave password empty
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Check that validation error is shown
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      'Password is required'
    );

    // Check that we're still on login page
    await expect(page).toHaveURL('/login');

    await testLogger.info('Empty password test passed', {
      test: 'should show error with empty password',
    });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Wait for error message to appear
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(
      'Invalid email or password'
    );

    // Check that we're still on login page
    await expect(page).toHaveURL('/login');

    // Check that form is still functional
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();

    await testLogger.info('Invalid credentials test passed', {
      test: 'should show error with invalid credentials',
    });
  });

  test('should show error with non-existent user', async ({ page }) => {
    // Fill in credentials for non-existent user
    await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Wait for error message to appear
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(
      'User not found'
    );

    // Check that we're still on login page
    await expect(page).toHaveURL('/login');

    await testLogger.info('Non-existent user test passed', {
      test: 'should show error with non-existent user',
    });
  });

  test('should show error with incorrect password', async ({ page }) => {
    // Fill in valid email but wrong password
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Wait for error message to appear
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(
      'Incorrect password'
    );

    // Check that we're still on login page
    await expect(page).toHaveURL('/login');

    await testLogger.info('Incorrect password test passed', {
      test: 'should show error with incorrect password',
    });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/login', (route) => {
      route.abort('failed');
    });

    // Fill in valid credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Wait for error message to appear
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText(
      'Network error. Please try again.'
    );

    // Check that we're still on login page
    await expect(page).toHaveURL('/login');

    await testLogger.info('Network error test passed', {
      test: 'should handle network errors gracefully',
    });
  });

  test('should show loading state during login', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, email: 'test@example.com' },
        }),
      });
    });

    // Fill in valid credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Check that loading state is shown
    await expect(page.locator('[data-testid="login-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();

    // Wait for login to complete
    await expect(page).toHaveURL('/dashboard');

    await testLogger.info('Loading state test passed', {
      test: 'should show loading state during login',
    });
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Navigate to a protected page first
    await page.goto('/analytics/players');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Fill in valid credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Should be redirected to the intended page
    await expect(page).toHaveURL('/analytics/players');

    await testLogger.info('Redirect test passed', {
      test: 'should redirect to intended page after login',
    });
  });

  test('should remember login state on page refresh', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Refresh the page
    await page.reload();

    // Should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');

    await testLogger.info('Login state persistence test passed', {
      test: 'should remember login state on page refresh',
    });
  });

  test('should show password visibility toggle', async ({ page }) => {
    // Check that password visibility toggle is present
    await expect(page.locator('[data-testid="password-toggle"]')).toBeVisible();

    // Fill in password
    await page.fill('[data-testid="password-input"]', 'password123');

    // Check that password is hidden by default
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await page.click('[data-testid="password-toggle"]');

    // Check that password is now visible
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await page.click('[data-testid="password-toggle"]');

    // Check that password is hidden again
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'password');

    await testLogger.info('Password visibility toggle test passed', {
      test: 'should show password visibility toggle',
    });
  });

  test('should validate form on submit', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="login-button"]');

    // Check that both fields show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

    // Fill in email only
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.click('[data-testid="login-button"]');

    // Check that only password error is shown
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

    // Fill in password
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Should proceed with login
    await expect(page).toHaveURL('/dashboard');

    await testLogger.info('Form validation test passed', {
      test: 'should validate form on submit',
    });
  });
});
