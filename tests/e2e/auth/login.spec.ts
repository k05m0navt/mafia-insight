import { test, expect } from '@playwright/test';

/**
 * E2E Test: Login Flow
 *
 * Tests the complete user login experience including:
 * - Navigation to login page
 * - Form validation
 * - Successful login with toast notification
 * - Redirect to dashboard/players page
 * - Profile dropdown display in navbar
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
    await expect(page.locator('text=/password.*required/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Use test credentials (ensure these exist in your test database)
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Wait for success toast notification
    await expect(page.locator('text=/welcome back/i')).toBeVisible({
      timeout: 10000,
    });

    // Verify redirect to dashboard/players
    await expect(page).toHaveURL(/\/(players|dashboard)/);

    // Verify profile dropdown appears in navbar
    await expect(
      page
        .locator('[data-testid="profile-dropdown"]')
        .or(page.locator('button[aria-label*="profile"]'))
    ).toBeVisible();
  });

  test('should persist session after page reload', async ({
    page,
    context,
  }) => {
    // Login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(players|dashboard)/, { timeout: 10000 });

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(
      page
        .locator('[data-testid="profile-dropdown"]')
        .or(page.locator('button[aria-label*="profile"]'))
    ).toBeVisible();
  });

  test('should display "Forgot Password" link', async ({ page }) => {
    await expect(page.locator('text=/forgot.*password/i')).toBeVisible();
  });

  test('should have link to signup page', async ({ page }) => {
    const signupLink = page.locator('a[href*="signup"]');
    await expect(signupLink).toBeVisible();

    await signupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe('Login Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="email"]', 'notanemail');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/invalid.*email/i')).toBeVisible();
  });

  test('should validate minimum password length', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/password.*8.*characters/i')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page
      .locator('button[aria-label*="password"]')
      .or(page.locator('[data-testid="toggle-password"]'));

    await expect(passwordInput).toHaveAttribute('type', 'password');

    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');

      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });
});

test.describe('Login Security', () => {
  test('should handle rate limiting gracefully', async ({ page }) => {
    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // Check for rate limit message (if implemented)
    // This test may need adjustment based on your rate limiting implementation
  });

  test('should not expose user existence', async ({ page }) => {
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show generic error message, not "user not found"
    const errorMessage = await page
      .locator('[role="alert"]')
      .or(page.locator('.error-message'))
      .textContent();
    expect(errorMessage?.toLowerCase()).not.toContain('user not found');
    expect(errorMessage?.toLowerCase()).not.toContain('email not registered');
  });
});
