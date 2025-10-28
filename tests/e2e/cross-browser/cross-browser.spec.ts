import { test, expect } from '../fixtures/auth';

test.describe('Cross-Browser Compatibility', () => {
  test('should work consistently across all browsers', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Test core functionality works in all browsers
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-players"]')).toBeVisible();
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible();

    // Test theme switching works in all browsers
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass('dark');

    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).not.toHaveClass('dark');

    // Test navigation works in all browsers
    await page.click('[data-testid="nav-players"]');
    await expect(page).toHaveURL('/players');

    // Test responsive design
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('should handle authentication consistently', async ({ page }) => {
    // Test login flow works in all browsers
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'user123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
