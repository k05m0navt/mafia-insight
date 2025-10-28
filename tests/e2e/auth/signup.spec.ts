import { test, expect } from '../fixtures/auth';
import { testUsers } from '../fixtures/users';

test.describe('Signup Flow', () => {
  test('should signup successfully with valid credentials', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'newuser@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirmPassword"]', 'password123');
    await page.click('[data-testid="signup-button"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Account created successfully'
    );
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      'user'
    );
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'newuser@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirmPassword"]', 'differentpassword');
    await page.click('[data-testid="signup-button"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Passwords do not match');
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirmPassword"]', 'password123');
    await page.click('[data-testid="signup-button"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Email is required');
  });

  test('should show validation error for empty password', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'newuser@example.com');
    await page.fill('[data-testid="confirmPassword"]', 'password123');
    await page.click('[data-testid="signup-button"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Password is required');
  });

  test('should show validation error for empty confirm password', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'newuser@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signup-button"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Confirm password is required');
  });

  test('should show validation error for invalid email format', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'invalid-email');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirmPassword"]', 'password123');
    await page.click('[data-testid="signup-button"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Invalid email format');
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'newuser@example.com');
    await page.fill('[data-testid="password"]', '123');
    await page.fill('[data-testid="confirmPassword"]', '123');
    await page.click('[data-testid="signup-button"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Password must be at least 8 characters');
  });

  test('should show error for existing email', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirmPassword"]', 'password123');
    await page.click('[data-testid="signup-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Email already exists'
    );
  });

  test('should redirect to home page after successful signup', async ({
    page,
  }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'newuser2@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirmPassword"]', 'password123');
    await page.click('[data-testid="signup-button"]');

    await expect(page).toHaveURL('/');
  });

  test('should show loading state during signup', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'newuser3@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirmPassword"]', 'password123');

    // Start signup and check for loading state
    const signupPromise = page.click('[data-testid="signup-button"]');
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();
    await signupPromise;
  });

  test('should disable form during signup', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'newuser4@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirmPassword"]', 'password123');

    // Start signup and check form is disabled
    const signupPromise = page.click('[data-testid="signup-button"]');
    await expect(page.locator('[data-testid="email"]')).toBeDisabled();
    await expect(page.locator('[data-testid="password"]')).toBeDisabled();
    await expect(
      page.locator('[data-testid="confirmPassword"]')
    ).toBeDisabled();
    await expect(page.locator('[data-testid="signup-button"]')).toBeDisabled();
    await signupPromise;
  });
});
