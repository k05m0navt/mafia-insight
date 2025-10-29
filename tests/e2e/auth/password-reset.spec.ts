import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Authentication - Password Reset Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to password reset page before each test
    await page.goto('/forgot-password');
    await testLogger.info('Navigated to password reset page', {
      url: page.url(),
      timestamp: new Date().toISOString(),
    });
  });

  test('should display password reset form with required fields', async ({
    page,
  }) => {
    // Check that password reset form is visible
    await expect(
      page.locator('[data-testid="password-reset-form"]')
    ).toBeVisible();

    // Check that email input is present
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
      'type',
      'email'
    );
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
      'required'
    );

    // Check that submit button is present
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled();

    // Check that back to login link is present
    await expect(
      page.locator('[data-testid="back-to-login-link"]')
    ).toBeVisible();

    // Check that form title is present
    await expect(page.locator('[data-testid="form-title"]')).toContainText(
      'Reset Password'
    );

    await testLogger.info('Password reset form validation passed', {
      test: 'should display password reset form with required fields',
    });
  });

  test('should send reset email successfully with valid email', async ({
    page,
  }) => {
    // Fill in valid email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Password reset email sent'
    );

    // Check that form is hidden and success message is shown
    await expect(
      page.locator('[data-testid="password-reset-form"]')
    ).not.toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Check that back to login link is still present
    await expect(
      page.locator('[data-testid="back-to-login-link"]')
    ).toBeVisible();

    await testLogger.info('Successful password reset email test passed', {
      test: 'should send reset email successfully with valid email',
      email: 'test@example.com',
    });
  });

  test('should show error with invalid email format', async ({ page }) => {
    // Fill in invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Check that validation error is shown
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      'Please enter a valid email address'
    );

    // Check that we're still on password reset page
    await expect(page).toHaveURL('/forgot-password');

    await testLogger.info('Invalid email format test passed', {
      test: 'should show error with invalid email format',
    });
  });

  test('should show error with empty email', async ({ page }) => {
    // Click submit button without filling email
    await page.click('[data-testid="submit-button"]');

    // Check that validation error is shown
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      'Email is required'
    );

    // Check that we're still on password reset page
    await expect(page).toHaveURL('/forgot-password');

    await testLogger.info('Empty email test passed', {
      test: 'should show error with empty email',
    });
  });

  test('should show error with non-existent email', async ({ page }) => {
    // Fill in non-existent email
    await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for error message to appear
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Email not found'
    );

    // Check that we're still on password reset page
    await expect(page).toHaveURL('/forgot-password');

    // Check that form is still functional
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();

    await testLogger.info('Non-existent email test passed', {
      test: 'should show error with non-existent email',
    });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/forgot-password', (route) => {
      route.abort('failed');
    });

    // Fill in valid email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for error message to appear
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText(
      'Network error. Please try again.'
    );

    // Check that we're still on password reset page
    await expect(page).toHaveURL('/forgot-password');

    await testLogger.info('Network error test passed', {
      test: 'should handle network errors gracefully',
    });
  });

  test('should show loading state during submission', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/auth/forgot-password', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Fill in valid email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Check that loading state is shown
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toBeDisabled();

    // Wait for submission to complete
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await testLogger.info('Loading state test passed', {
      test: 'should show loading state during submission',
    });
  });

  test('should redirect to login page from back to login link', async ({
    page,
  }) => {
    // Click on back to login link
    await page.click('[data-testid="back-to-login-link"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Check that login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    await testLogger.info('Redirect to login test passed', {
      test: 'should redirect to login page from back to login link',
    });
  });

  test('should handle rate limiting gracefully', async ({ page }) => {
    // Mock rate limiting response
    await page.route('**/api/auth/forgot-password', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Too many requests. Please try again later.',
        }),
      });
    });

    // Fill in valid email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

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

  test('should validate email format in real-time', async ({ page }) => {
    // Fill in invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');

    // Check that validation error appears immediately
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      'Please enter a valid email address'
    );

    // Fix the email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Check that validation error disappears
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();

    await testLogger.info('Real-time email validation test passed', {
      test: 'should validate email format in real-time',
    });
  });

  test('should handle multiple submission attempts', async ({ page }) => {
    // Fill in valid email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Click submit button multiple times rapidly
    await page.click('[data-testid="submit-button"]');
    await page.click('[data-testid="submit-button"]');
    await page.click('[data-testid="submit-button"]');

    // Should only submit once
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Should not be able to submit again
    await expect(
      page.locator('[data-testid="password-reset-form"]')
    ).not.toBeVisible();

    await testLogger.info('Multiple submission attempts test passed', {
      test: 'should handle multiple submission attempts',
    });
  });

  test('should show success message with instructions', async ({ page }) => {
    // Fill in valid email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Check that success message contains instructions
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Check your email'
    );
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'reset link'
    );

    // Check that instructions are present
    await expect(page.locator('[data-testid="instructions"]')).toBeVisible();
    await expect(page.locator('[data-testid="instructions"]')).toContainText(
      'Click the link in your email'
    );

    await testLogger.info('Success message with instructions test passed', {
      test: 'should show success message with instructions',
    });
  });

  test('should handle email case sensitivity', async ({ page }) => {
    // Fill in email with different case
    await page.fill('[data-testid="email-input"]', 'TEST@EXAMPLE.COM');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Should still work (email should be case-insensitive)
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await testLogger.info('Email case sensitivity test passed', {
      test: 'should handle email case sensitivity',
    });
  });

  test('should handle email with extra spaces', async ({ page }) => {
    // Fill in email with extra spaces
    await page.fill('[data-testid="email-input"]', '  test@example.com  ');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Should still work (spaces should be trimmed)
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    await testLogger.info('Email with extra spaces test passed', {
      test: 'should handle email with extra spaces',
    });
  });

  test('should show error for disabled account', async ({ page }) => {
    // Mock disabled account response
    await page.route('**/api/auth/forgot-password', (route) => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Account is disabled' }),
      });
    });

    // Fill in valid email
    await page.fill('[data-testid="email-input"]', 'disabled@example.com');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Account is disabled'
    );

    await testLogger.info('Disabled account test passed', {
      test: 'should show error for disabled account',
    });
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/api/auth/forgot-password', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Fill in valid email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

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
});
