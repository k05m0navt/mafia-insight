import { test, expect } from '@playwright/test';

test.describe('Authentication Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should maintain login functionality after changes', async ({
    page,
  }) => {
    // Test login flow
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Submit login
    await page.click('[data-testid="login-button"]');

    // Verify successful login
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should maintain logout functionality after changes', async ({
    page,
  }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

    // Test logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Verify successful logout
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
  });

  test('should maintain registration functionality after changes', async ({
    page,
  }) => {
    // Test registration flow
    await page.goto('/register');
    await expect(page.locator('[data-testid="register-page"]')).toBeVisible();

    // Fill registration form
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Verify successful registration
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should maintain password reset functionality after changes', async ({
    page,
  }) => {
    // Test password reset flow
    await page.goto('/forgot-password');
    await expect(
      page.locator('[data-testid="forgot-password-page"]')
    ).toBeVisible();

    // Fill email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Submit password reset
    await page.click('[data-testid="reset-password-button"]');

    // Verify password reset email sent
    await expect(
      page.locator('[data-testid="reset-email-sent"]')
    ).toBeVisible();
  });

  test('should maintain role-based access control after changes', async ({
    page,
  }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    // Verify admin access
    await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();

    // Test admin functionality
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="users-list"]')).toBeVisible();
  });

  test('should maintain user profile functionality after changes', async ({
    page,
  }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Test profile access
    await page.goto('/profile');
    await expect(page.locator('[data-testid="profile-page"]')).toBeVisible();

    // Test profile editing
    await page.fill('[data-testid="name-input"]', 'Updated Name');
    await page.click('[data-testid="save-profile-button"]');

    // Verify profile updated
    await expect(page.locator('[data-testid="profile-updated"]')).toBeVisible();
  });

  test('should maintain session management after changes', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Verify session is maintained
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

    // Test session persistence
    await page.reload();
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should maintain authentication error handling after changes', async ({
    page,
  }) => {
    // Test invalid login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText(
      'Invalid credentials'
    );
  });

  test('should maintain token refresh functionality after changes', async ({
    page,
  }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Simulate token expiration
    await page.evaluate(() => {
      localStorage.setItem('token', 'expired-token');
    });

    // Test token refresh
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('should maintain multi-factor authentication after changes', async ({
    page,
  }) => {
    // Test MFA setup
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'mfa@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Verify MFA prompt
    await expect(page.locator('[data-testid="mfa-prompt"]')).toBeVisible();

    // Enter MFA code
    await page.fill('[data-testid="mfa-code-input"]', '123456');
    await page.click('[data-testid="verify-mfa-button"]');

    // Verify successful MFA
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });
});
