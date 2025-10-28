import { test, expect } from '../fixtures/auth';
import { testUsers } from '../fixtures/users';

test.describe('Permission-Based Access', () => {
  test('should allow admin access to admin pages', async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();

    await page.goto('/admin/permissions');
    await expect(
      page.locator('[data-testid="permission-management"]')
    ).toBeVisible();
    await expect(page).toHaveURL('/admin/permissions');
  });

  test('should deny user access to admin pages', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    await page.goto('/admin/permissions');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="suggested-actions"]')
    ).toBeVisible();
  });

  test('should deny guest access to protected pages', async ({
    page,
    loginAsGuest,
  }) => {
    await loginAsGuest();

    await page.goto('/players');
    await expect(page).toHaveURL('/login');
  });

  test('should allow users with read permission to view players', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    await page.goto('/players');
    await expect(page.locator('[data-testid="players-list"]')).toBeVisible();
    await expect(page).toHaveURL('/players');
  });

  test('should deny users without permission to view analytics', async ({
    page,
    loginAsUser,
  }) => {
    // Mock user without analytics permission
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Remove analytics permission
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('permissionsChanged', {
          detail: { permissions: ['read:players'] },
        })
      );
    });

    await page.goto('/analytics');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });

  test('should show appropriate error message for access denied', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    await page.goto('/admin/permissions');
    await expect(page.locator('[data-testid="access-denied"]')).toContainText(
      'Access Denied'
    );
    await expect(page.locator('[data-testid="access-denied"]')).toContainText(
      'You do not have permission to access this page'
    );
  });

  test('should show suggested actions for access denied', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    await page.goto('/admin/permissions');
    await expect(
      page.locator('[data-testid="suggested-actions"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="suggested-actions"]')
    ).toContainText('Contact an administrator');
  });

  test('should redirect to login for unauthenticated users', async ({
    page,
    loginAsGuest,
  }) => {
    await loginAsGuest();

    const protectedRoutes = ['/players', '/analytics', '/admin'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });

  test('should update navigation based on permissions', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Initially should see players nav
    await expect(page.locator('[data-testid="nav-players"]')).toBeVisible();

    // Remove players permission
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('permissionsChanged', {
          detail: { permissions: [] },
        })
      );
    });

    // Should no longer see players nav
    await expect(page.locator('[data-testid="nav-players"]')).not.toBeVisible();
  });

  test('should handle permission changes in real-time', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Navigate to players page
    await page.goto('/players');
    await expect(page.locator('[data-testid="players-list"]')).toBeVisible();

    // Remove players permission
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('permissionsChanged', {
          detail: { permissions: [] },
        })
      );
    });

    // Should show access denied
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });

  test('should show different content based on user role', async ({
    page,
    loginAsAdmin,
    loginAsUser,
  }) => {
    // Test admin view
    await loginAsAdmin();
    await page.goto('/players');
    await expect(page.locator('[data-testid="admin-controls"]')).toBeVisible();

    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Test user view
    await page.goto('/players');
    await expect(
      page.locator('[data-testid="admin-controls"]')
    ).not.toBeVisible();
  });

  test('should validate permissions on page load', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Direct navigation to protected page
    await page.goto('/admin/permissions');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });

  test('should handle multiple permission requirements', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Test page requiring multiple permissions
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });
});
