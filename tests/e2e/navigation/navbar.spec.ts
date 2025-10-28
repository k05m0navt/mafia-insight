import { test, expect } from '../fixtures/auth';

test.describe('Navigation Bar', () => {
  test('should show admin navigation for admin users', async ({
    page,
    loginAsAdmin,
  }) => {
    await loginAsAdmin();

    // Admin should see all navigation items
    await expect(page.locator('[data-testid="nav-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-players"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-admin"]')).toBeVisible();
  });

  test('should show user navigation for regular users', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // User should see limited navigation items
    await expect(page.locator('[data-testid="nav-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-players"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible();
  });

  test('should show guest navigation for unauthenticated users', async ({
    page,
    loginAsGuest,
  }) => {
    await loginAsGuest();

    // Guest should see minimal navigation
    await expect(page.locator('[data-testid="nav-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-players"]')).not.toBeVisible();
    await expect(
      page.locator('[data-testid="nav-analytics"]')
    ).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible();
  });

  test('should highlight active page in navigation', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Navigate to players page
    await page.click('[data-testid="nav-players"]');
    await expect(page.locator('[data-testid="nav-players"]')).toHaveClass(
      /active/
    );
    await expect(page.locator('[data-testid="nav-home"]')).not.toHaveClass(
      /active/
    );
  });

  test('should show user menu for authenticated users', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      'user'
    );
  });

  test('should not show user menu for guest users', async ({
    page,
    loginAsGuest,
  }) => {
    await loginAsGuest();

    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should show theme toggle in navigation', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();
  });

  test('should show login/logout buttons appropriately', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();

    // Should show logout button when logged in
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="login-button"]')
    ).not.toBeVisible();

    await logout();

    // Should show login button when logged out
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="logout-button"]')
    ).not.toBeVisible();
  });

  test('should be responsive on mobile devices', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigation should be visible but may be in hamburger menu
    await expect(page.locator('[data-testid="nav-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-players"]')).toBeVisible();
  });

  test('should update navigation when user role changes', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Initially should not see admin nav
    await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible();

    // Simulate role change to admin
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('roleChanged', {
          detail: { role: 'admin', permissions: ['admin:players'] },
        })
      );
    });

    // Should now see admin nav
    await expect(page.locator('[data-testid="nav-admin"]')).toBeVisible();
  });

  test('should show navigation on all pages', async ({ page, loginAsUser }) => {
    await loginAsUser();

    const pages = ['/', '/players', '/analytics'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
    }
  });

  test('should handle navigation clicks correctly', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Click on players navigation
    await page.click('[data-testid="nav-players"]');
    await expect(page).toHaveURL('/players');

    // Click on analytics navigation
    await page.click('[data-testid="nav-analytics"]');
    await expect(page).toHaveURL('/analytics');

    // Click on home navigation
    await page.click('[data-testid="nav-home"]');
    await expect(page).toHaveURL('/');
  });
});
