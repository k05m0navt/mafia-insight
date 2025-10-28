import { test, expect } from '../fixtures/auth';

test.describe('Logout Flow', () => {
  test('should logout successfully from user menu', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();
    await logout();
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully from admin user', async ({
    page,
    loginAsAdmin,
    logout,
  }) => {
    await loginAsAdmin();
    await logout();
    await expect(page).toHaveURL('/login');
  });

  test('should clear user session after logout', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();
    await logout();

    // Try to access protected page
    await page.goto('/players');
    await expect(page).toHaveURL('/login');
  });

  test('should clear navigation state after logout', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    await logout();
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should redirect to login page after logout', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();
    await page.goto('/players');
    await logout();
    await expect(page).toHaveURL('/login');
  });

  test('should show success message after logout', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();
    await logout();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Logged out successfully'
    );
  });

  test('should clear theme preferences after logout', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();

    // Set theme preference
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass('dark');

    await logout();

    // Theme should reset to default
    await expect(page.locator('html')).not.toHaveClass('dark');
  });

  test('should prevent access to protected routes after logout', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();
    await logout();

    // Try to access various protected routes
    const protectedRoutes = ['/players', '/analytics', '/admin'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });

  test('should handle logout from any page', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();
    await page.goto('/players');
    await logout();
    await expect(page).toHaveURL('/login');
  });

  test('should show login form after logout', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();
    await logout();

    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });
});
