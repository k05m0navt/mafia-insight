import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Validation Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should handle client-side validation errors', async ({ page }) => {
    await testLogger.info('Testing client-side validation');

    await page.goto('/login');

    // Try to submit empty form
    await page.locator('[data-testid="login-button"]').click();

    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should handle server-side validation errors', async ({ page }) => {
    await testLogger.info('Testing server-side validation');

    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Validation failed',
          errors: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too short' },
          ],
        }),
      });
    });

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'short');
    await page.locator('[data-testid="login-button"]').click();

    await expect(
      page.locator('[data-testid="validation-errors"]')
    ).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await testLogger.info('Testing email validation');

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'not-an-email');
    await page.locator('[data-testid="login-button"]').click();

    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      'valid email'
    );
  });

  test('should validate required fields', async ({ page }) => {
    await testLogger.info('Testing required field validation');

    await page.goto('/signup');

    // Try to submit without required fields
    await page.locator('[data-testid="signup-button"]').click();

    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await testLogger.info('Testing password validation');

    await page.goto('/signup');
    await page.fill('[data-testid="password-input"]', 'weak');
    await page.locator('[data-testid="signup-button"]').click();

    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      'strong'
    );
  });

  test('should show field-specific error messages', async ({ page }) => {
    await testLogger.info('Testing field-specific errors');

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', '');
    await page.locator('[data-testid="login-button"]').click();

    // Should only show password error
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should clear validation errors on input change', async ({ page }) => {
    await testLogger.info('Testing error clearing');

    await page.goto('/login');

    // Trigger validation error
    await page.locator('[data-testid="login-button"]').click();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();

    // Start typing
    await page.fill('[data-testid="email-input"]', 't');

    // Error should clear
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
  });

  test('should validate form submission', async ({ page }) => {
    await testLogger.info('Testing form submission validation');

    await page.goto('/signup');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john@example.com');
    await page.fill('[data-testid="password-input"]', 'Password123');

    // Form should be valid
    const isEnabled = await page
      .locator('[data-testid="signup-button"]')
      .isEnabled();
    expect(isEnabled).toBe(true);
  });

  test('should handle custom validation rules', async ({ page }) => {
    await testLogger.info('Testing custom validation');

    await page.goto('/profile');
    await page.fill('[data-testid="phone-input"]', '123');
    await page.locator('[data-testid="save-button"]').click();

    await expect(page.locator('[data-testid="phone-error"]')).toContainText(
      'phone number'
    );
  });

  test('should display inline validation feedback', async ({ page }) => {
    await testLogger.info('Testing inline validation');

    await page.goto('/signup');

    // Enter valid email
    await page.fill('[data-testid="email-input"]', 'valid@example.com');

    // Should show success indicator
    await expect(page.locator('[data-testid="email-success"]')).toBeVisible();
  });

  test('should prevent submission of invalid forms', async ({ page }) => {
    await testLogger.info('Testing invalid form prevention');

    await page.goto('/signup');

    // Fill with invalid data
    await page.fill('[data-testid="email-input"]', 'invalid');
    await page.fill('[data-testid="password-input"]', 'weak');

    // Button should be disabled
    await expect(page.locator('[data-testid="signup-button"]')).toBeDisabled();
  });
});
