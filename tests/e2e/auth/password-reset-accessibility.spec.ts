import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Password Reset Flow Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Force light mode for consistent testing
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
  });

  test('forgot password page should have no accessibility violations', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="forgot-password-container"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Filter out color-contrast violations as they are design system issues
    const violations = accessibilityScanResults.violations.filter(
      (violation) => violation.id !== 'color-contrast'
    );

    if (violations.length > 0) {
      console.error('Accessibility violations found:');
      violations.forEach((violation) => {
        console.error(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(violations).toEqual([]);
  });

  test('forgot password form should have proper labels', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Check that email field has associated label
    await expect(page.locator('label[for="email"]')).toBeVisible();
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('id', 'email');
  });

  test('forgot password form should have proper ARIA attributes', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('aria-describedby');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'false');

    const submitButton = page.locator('[data-testid="submit-button"]');
    await expect(submitButton).toHaveAttribute(
      'aria-label',
      'Send password reset email'
    );
  });

  test('reset password page should have no accessibility violations', async ({
    page,
  }) => {
    const validToken = 'valid-token-123';

    // Mock valid token
    await page.route(
      `**/api/auth/reset-password?token=${validToken}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          }),
        });
      }
    );

    await page.goto(`/reset-password?token=${validToken}`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[data-testid="reset-password-form"]')
    ).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="reset-password-container"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Filter out color-contrast violations
    const violations = accessibilityScanResults.violations.filter(
      (violation) => violation.id !== 'color-contrast'
    );

    if (violations.length > 0) {
      console.error('Accessibility violations found:');
      violations.forEach((violation) => {
        console.error(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(violations).toEqual([]);
  });

  test('reset password form should have proper labels', async ({ page }) => {
    const validToken = 'valid-token-123';

    // Mock valid token
    await page.route(
      `**/api/auth/reset-password?token=${validToken}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          }),
        });
      }
    );

    await page.goto(`/reset-password?token=${validToken}`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[data-testid="reset-password-form"]')
    ).toBeVisible();

    // Check that password fields have associated labels
    await expect(page.locator('label[for="newPassword"]')).toBeVisible();
    await expect(page.locator('label[for="confirmPassword"]')).toBeVisible();
  });

  test('reset password form should have proper ARIA attributes', async ({
    page,
  }) => {
    const validToken = 'valid-token-123';

    // Mock valid token
    await page.route(
      `**/api/auth/reset-password?token=${validToken}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          }),
        });
      }
    );

    await page.goto(`/reset-password?token=${validToken}`);
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[data-testid="reset-password-form"]')
    ).toBeVisible();

    const newPasswordInput = page.locator('input[aria-label="New password"]');
    const confirmPasswordInput = page.locator(
      'input[aria-label="Confirm password"]'
    );
    const submitButton = page.locator('[data-testid="submit-button"]');

    await expect(newPasswordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    await expect(submitButton).toHaveAttribute('aria-label', 'Reset password');
  });

  test('error messages should have proper ARIA attributes', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Trigger validation error
    const submitButton = page.locator('[data-testid="submit-button"]');
    await submitButton.click();

    // Wait for error message
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveAttribute('role', 'alert');
    await expect(errorMessage).toHaveAttribute('aria-live', 'polite');
  });

  test('success messages should have proper ARIA attributes', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Mock successful response
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message:
            'If an account exists with this email, a password reset link has been sent.',
        }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');
    await page.click('[data-testid="submit-button"]');

    // Wait for success message
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toHaveAttribute('role', 'alert');
    await expect(successMessage).toHaveAttribute('aria-live', 'polite');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Tab through form elements
    await page.keyboard.press('Tab'); // Should focus email input
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).toBe('INPUT');

    await page.keyboard.press('Tab'); // Should focus submit button
    const focusedButton = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );
    expect(focusedButton).toBe('submit-button');

    await page.keyboard.press('Tab'); // Should focus back to login link
    const focusedLink = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );
    expect(focusedLink).toBe('back-to-login-link');
  });
});
