import { test, expect } from '@playwright/test';

test.describe('Password Reset Flow - Complete E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should complete full password reset flow', async ({ page }) => {
    // Step 1: Navigate to forgot password page
    await page.click('[data-testid="forgot-password-link"]');
    await expect(page).toHaveURL('/forgot-password');

    // Step 2: Submit forgot password form
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    // Mock API response
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

    await page.click('[data-testid="submit-button"]');

    // Step 3: Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'If an account exists with this email'
    );

    // Step 4: Navigate to reset password page with token (simulated)
    const resetToken = 'mock-reset-token-123456789012345678901234567890';
    await page.goto(`/reset-password?token=${resetToken}`);

    // Mock token validation
    await page.route(
      `**/api/auth/reset-password?token=${resetToken}`,
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

    // Step 5: Wait for form to appear
    await expect(
      page.locator('[data-testid="reset-password-form"]')
    ).toBeVisible();

    // Step 6: Fill in new password
    const newPasswordInput = page.locator('input[aria-label="New password"]');
    const confirmPasswordInput = page.locator(
      'input[aria-label="Confirm password"]'
    );
    const newPassword = 'NewP@ssw0rd123';

    await newPasswordInput.fill(newPassword);
    await confirmPasswordInput.fill(newPassword);

    // Mock password reset API
    await page.route('**/api/auth/reset-password', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message:
              'Password reset successfully. Please log in with your new password.',
          }),
        });
      }
    });

    // Step 7: Submit password reset
    await page.click('[data-testid="submit-button"]');

    // Step 8: Verify redirect to login with success message
    await expect(page).toHaveURL(/\/login\?reset=success/);
  });

  test('should handle expired token', async ({ page }) => {
    const expiredToken = 'expired-token-123';
    await page.goto(`/reset-password?token=${expiredToken}`);

    // Mock expired token response
    await page.route(
      `**/api/auth/reset-password?token=${expiredToken}`,
      async (route) => {
        await route.fulfill({
          status: 410,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: false,
            error: 'Invalid or expired token',
          }),
        });
      }
    );

    // Wait for error page
    await expect(page.locator('[data-testid="token-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="token-error"]')).toContainText(
      'Invalid or Expired Link'
    );

    // Verify link to request new reset email
    await expect(
      page.locator('[data-testid="request-new-link"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="request-new-link"]')
    ).toHaveAttribute('href', '/forgot-password');
  });

  test('should handle invalid token', async ({ page }) => {
    const invalidToken = 'invalid-token';
    await page.goto(`/reset-password?token=${invalidToken}`);

    // Mock invalid token response
    await page.route(
      `**/api/auth/reset-password?token=${invalidToken}`,
      async (route) => {
        await route.fulfill({
          status: 410,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: false,
            error: 'Invalid or expired token',
          }),
        });
      }
    );

    await expect(page.locator('[data-testid="token-error"]')).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    const validToken = 'valid-token-123';
    await page.goto(`/reset-password?token=${validToken}`);

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

    await expect(
      page.locator('[data-testid="reset-password-form"]')
    ).toBeVisible();

    const newPasswordInput = page.locator('input[aria-label="New password"]');
    const submitButton = page.locator('[data-testid="submit-button"]');

    // Try weak password
    await newPasswordInput.fill('weak');
    await submitButton.click();

    // Should show validation error
    await expect(
      page.locator('text=/password must be at least 8 characters/i')
    ).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    const validToken = 'valid-token-123';
    await page.goto(`/reset-password?token=${validToken}`);

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

    await expect(
      page.locator('[data-testid="reset-password-form"]')
    ).toBeVisible();

    const newPasswordInput = page.locator('input[aria-label="New password"]');
    const confirmPasswordInput = page.locator(
      'input[aria-label="Confirm password"]'
    );
    const submitButton = page.locator('[data-testid="submit-button"]');

    await newPasswordInput.fill('NewP@ssw0rd123');
    await confirmPasswordInput.fill('DifferentP@ss1');
    await submitButton.click();

    // Should show mismatch error
    await expect(page.locator('text=/passwords do not match/i')).toBeVisible();
  });

  test('should show password strength meter', async ({ page }) => {
    const validToken = 'valid-token-123';
    await page.goto(`/reset-password?token=${validToken}`);

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

    await expect(
      page.locator('[data-testid="reset-password-form"]')
    ).toBeVisible();

    const newPasswordInput = page.locator('input[aria-label="New password"]');
    await newPasswordInput.fill('Password123!');

    // Password strength meter should appear
    await expect(page.locator('text=/password strength/i')).toBeVisible();
  });
});
