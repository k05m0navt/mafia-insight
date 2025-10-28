import { test, expect } from '../fixtures/auth';
import { testUsers } from '../fixtures/users';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      'admin'
    );
  });

  test('should login successfully with user credentials', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      'user'
    );
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials'
    );
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Email is required');
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.click('[data-testid="login-button"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Password is required');
  });

  test('should show validation error for invalid email format', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'invalid-email');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Invalid email format');
  });

  test('should redirect to home page after successful login', async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();
    await expect(page).toHaveURL('/');
  });

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'admin123');

    // Start login and check for loading state
    const loginPromise = page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();
    await loginPromise;
  });

  test('should disable form during login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'admin123');

    // Start login and check form is disabled
    const loginPromise = page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email"]')).toBeDisabled();
    await expect(page.locator('[data-testid="password"]')).toBeDisabled();
    await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
    await loginPromise;
  });

  test('should remember login state on page refresh', async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();
    await page.reload();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      'admin'
    );
  });
});
