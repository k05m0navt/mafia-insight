import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Authentication - Password Reset Confirmation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to password reset confirmation page with valid token
    await page.goto('/reset-password?token=valid-reset-token');
    await testLogger.info('Navigated to password reset confirmation page', {
      url: page.url(),
      timestamp: new Date().toISOString(),
    });
  });

  test('should display password reset confirmation form with required fields', async ({
    page,
  }) => {
    // Check that password reset confirmation form is visible
    await expect(
      page.locator('[data-testid="password-reset-confirm-form"]')
    ).toBeVisible();

    // Check that new password input is present
    await expect(
      page.locator('[data-testid="new-password-input"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="new-password-input"]')
    ).toHaveAttribute('type', 'password');
    await expect(
      page.locator('[data-testid="new-password-input"]')
    ).toHaveAttribute('required');

    // Check that confirm password input is present
    await expect(
      page.locator('[data-testid="confirm-password-input"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-input"]')
    ).toHaveAttribute('type', 'password');
    await expect(
      page.locator('[data-testid="confirm-password-input"]')
    ).toHaveAttribute('required');

    // Check that submit button is present
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled();

    // Check that form title is present
    await expect(page.locator('[data-testid="form-title"]')).toContainText(
      'Reset Password'
    );

    await testLogger.info(
      'Password reset confirmation form validation passed',
      {
        test: 'should display password reset confirmation form with required fields',
      }
    );
  });

  test('should reset password successfully with valid data', async ({
    page,
  }) => {
    // Fill in valid password data
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Password reset successfully'
    );

    // Wait for navigation to login page
    await expect(page).toHaveURL('/login');

    // Check that login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    await testLogger.info('Successful password reset test passed', {
      test: 'should reset password successfully with valid data',
    });
  });

  test('should show error with password mismatch', async ({ page }) => {
    // Fill in data with mismatched passwords
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill(
      '[data-testid="confirm-password-input"]',
      'differentpassword'
    );

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Check that validation error is shown
    await expect(
      page.locator('[data-testid="confirm-password-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-error"]')
    ).toContainText('Passwords do not match');

    // Check that we're still on password reset page
    await expect(page).toHaveURL('/reset-password');

    await testLogger.info('Password mismatch test passed', {
      test: 'should show error with password mismatch',
    });
  });

  test('should show error with weak password', async ({ page }) => {
    // Fill in data with weak password
    await page.fill('[data-testid="new-password-input"]', '123');
    await page.fill('[data-testid="confirm-password-input"]', '123');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Check that validation error is shown
    await expect(
      page.locator('[data-testid="new-password-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="new-password-error"]')
    ).toContainText('Password must be at least 8 characters long');

    // Check that we're still on password reset page
    await expect(page).toHaveURL('/reset-password');

    await testLogger.info('Weak password test passed', {
      test: 'should show error with weak password',
    });
  });

  test('should show error with empty password', async ({ page }) => {
    // Click submit button without filling password
    await page.click('[data-testid="submit-button"]');

    // Check that validation error is shown
    await expect(
      page.locator('[data-testid="new-password-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="new-password-error"]')
    ).toContainText('Password is required');

    // Check that we're still on password reset page
    await expect(page).toHaveURL('/reset-password');

    await testLogger.info('Empty password test passed', {
      test: 'should show error with empty password',
    });
  });

  test('should show error with invalid token', async ({ page }) => {
    // Navigate to password reset page with invalid token
    await page.goto('/reset-password?token=invalid-token');

    // Check that error message is shown
    await expect(page.locator('[data-testid="token-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="token-error"]')).toContainText(
      'Invalid or expired reset token'
    );

    // Check that form is not visible
    await expect(
      page.locator('[data-testid="password-reset-confirm-form"]')
    ).not.toBeVisible();

    // Check that back to login link is present
    await expect(
      page.locator('[data-testid="back-to-login-link"]')
    ).toBeVisible();

    await testLogger.info('Invalid token test passed', {
      test: 'should show error with invalid token',
    });
  });

  test('should show error with expired token', async ({ page }) => {
    // Navigate to password reset page with expired token
    await page.goto('/reset-password?token=expired-token');

    // Check that error message is shown
    await expect(page.locator('[data-testid="token-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="token-error"]')).toContainText(
      'Reset token has expired'
    );

    // Check that form is not visible
    await expect(
      page.locator('[data-testid="password-reset-confirm-form"]')
    ).not.toBeVisible();

    // Check that request new token link is present
    await expect(
      page.locator('[data-testid="request-new-token-link"]')
    ).toBeVisible();

    await testLogger.info('Expired token test passed', {
      test: 'should show error with expired token',
    });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/reset-password', (route) => {
      route.abort('failed');
    });

    // Fill in valid password data
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for error message to appear
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText(
      'Network error. Please try again.'
    );

    // Check that we're still on password reset page
    await expect(page).toHaveURL('/reset-password');

    await testLogger.info('Network error test passed', {
      test: 'should handle network errors gracefully',
    });
  });

  test('should show loading state during submission', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/auth/reset-password', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Fill in valid password data
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Check that loading state is shown
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeDisabled();

    // Wait for submission to complete
    await expect(page).toHaveURL('/login');

    await testLogger.info('Loading state test passed', {
      test: 'should show loading state during submission',
    });
  });

  test('should validate password strength in real-time', async ({ page }) => {
    // Fill in weak password
    await page.fill('[data-testid="new-password-input"]', '123');

    // Check that password strength indicator shows weak
    await expect(
      page.locator('[data-testid="password-strength-indicator"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="password-strength-indicator"]')
    ).toHaveClass(/weak/);

    // Improve password
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');

    // Check that password strength indicator shows strong
    await expect(
      page.locator('[data-testid="password-strength-indicator"]')
    ).toHaveClass(/strong/);

    await testLogger.info('Password strength validation test passed', {
      test: 'should validate password strength in real-time',
    });
  });

  test('should show password visibility toggle', async ({ page }) => {
    // Check that password visibility toggle is present
    await expect(
      page.locator('[data-testid="new-password-toggle"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-toggle"]')
    ).toBeVisible();

    // Fill in passwords
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');

    // Check that passwords are hidden by default
    await expect(
      page.locator('[data-testid="new-password-input"]')
    ).toHaveAttribute('type', 'password');
    await expect(
      page.locator('[data-testid="confirm-password-input"]')
    ).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await page.click('[data-testid="new-password-toggle"]');

    // Check that password is now visible
    await expect(
      page.locator('[data-testid="new-password-input"]')
    ).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await page.click('[data-testid="new-password-toggle"]');

    // Check that password is hidden again
    await expect(
      page.locator('[data-testid="new-password-input"]')
    ).toHaveAttribute('type', 'password');

    await testLogger.info('Password visibility toggle test passed', {
      test: 'should show password visibility toggle',
    });
  });

  test('should validate form on submit', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="submit-button"]');

    // Check that both password fields show validation errors
    await expect(
      page.locator('[data-testid="new-password-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-error"]')
    ).toBeVisible();

    // Fill in new password only
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.click('[data-testid="submit-button"]');

    // Check that only confirm password error is shown
    await expect(
      page.locator('[data-testid="new-password-error"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-error"]')
    ).toBeVisible();

    // Fill in confirm password
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');
    await page.click('[data-testid="submit-button"]');

    // Should proceed with password reset
    await expect(page).toHaveURL('/login');

    await testLogger.info('Form validation test passed', {
      test: 'should validate form on submit',
    });
  });

  test('should redirect to login page after successful reset', async ({
    page,
  }) => {
    // Fill in valid password data
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Check that login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // Check that success message is shown on login page
    await expect(
      page.locator('[data-testid="password-reset-success"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="password-reset-success"]')
    ).toContainText('Password reset successfully');

    await testLogger.info('Redirect to login test passed', {
      test: 'should redirect to login page after successful reset',
    });
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/api/auth/reset-password', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Fill in valid password data
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for error message
    await expect(page.locator('[data-testid="server-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="server-error"]')).toContainText(
      'Something went wrong'
    );

    // Check that retry button is present
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    await testLogger.info('Server error test passed', {
      test: 'should handle server errors gracefully',
    });
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    // Mock rate limiting response
    await page.route('**/api/auth/reset-password', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Too many requests. Please try again later.',
        }),
      });
    });

    // Fill in valid password data
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for rate limiting error message
    await expect(
      page.locator('[data-testid="rate-limit-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="rate-limit-error"]')
    ).toContainText('Too many requests');

    // Check that retry button is present
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    await testLogger.info('Rate limiting test passed', {
      test: 'should handle rate limiting gracefully',
    });
  });

  test('should handle multiple submission attempts', async ({ page }) => {
    // Fill in valid password data
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');

    // Click submit button multiple times rapidly
    await page.click('[data-testid="submit-button"]');
    await page.click('[data-testid="submit-button"]');
    await page.click('[data-testid="submit-button"]');

    // Should only submit once
    await expect(page).toHaveURL('/login');

    await testLogger.info('Multiple submission attempts test passed', {
      test: 'should handle multiple submission attempts',
    });
  });

  test('should show error for already used token', async ({ page }) => {
    // Mock already used token response
    await page.route('**/api/auth/reset-password', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Reset token has already been used' }),
      });
    });

    // Fill in valid password data
    await page.fill('[data-testid="new-password-input"]', 'newpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'newpassword123');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Reset token has already been used'
    );

    // Check that request new token link is present
    await expect(
      page.locator('[data-testid="request-new-token-link"]')
    ).toBeVisible();

    await testLogger.info('Already used token test passed', {
      test: 'should show error for already used token',
    });
  });

  test('should handle password history validation', async ({ page }) => {
    // Mock password history validation response
    await page.route('**/api/auth/reset-password', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error:
            'Password has been used recently. Please choose a different password.',
        }),
      });
    });

    // Fill in password that was recently used
    await page.fill('[data-testid="new-password-input"]', 'oldpassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'oldpassword123');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Password has been used recently'
    );

    await testLogger.info('Password history validation test passed', {
      test: 'should handle password history validation',
    });
  });
});
