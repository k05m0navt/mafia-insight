import { test, expect } from '../fixtures/auth';

test.describe('Theme Management', () => {
  test('should toggle between light and dark theme', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Initially should be light theme
    await expect(page.locator('html')).not.toHaveClass('dark');

    // Toggle to dark theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass('dark');

    // Toggle back to light theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).not.toHaveClass('dark');
  });

  test('should persist theme preference across page reloads', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Set to dark theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass('dark');

    // Reload page
    await page.reload();
    await expect(page.locator('html')).toHaveClass('dark');
  });

  test('should persist theme preference across sessions', async ({
    page,
    loginAsUser,
    logout,
  }) => {
    await loginAsUser();

    // Set to dark theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass('dark');

    // Logout and login again
    await logout();
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'user@example.com');
    await page.fill('[data-testid="password"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Theme should still be dark
    await expect(page.locator('html')).toHaveClass('dark');
  });

  test('should detect system preference on first visit', async ({ page }) => {
    // Set system preference to dark
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    // Should automatically use dark theme
    await expect(page.locator('html')).toHaveClass('dark');
  });

  test('should show correct theme toggle icon', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Light theme should show moon icon
    await expect(page.locator('[data-testid="theme-toggle"]')).toContainText(
      '🌙'
    );

    // Dark theme should show sun icon
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('[data-testid="theme-toggle"]')).toContainText(
      '☀️'
    );
  });

  test('should apply theme to all pages', async ({ page, loginAsUser }) => {
    await loginAsUser();

    // Set to dark theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass('dark');

    // Navigate to different pages
    const pages = ['/', '/players', '/analytics'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await expect(page.locator('html')).toHaveClass('dark');
    }
  });

  test('should handle theme toggle with smooth transition', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Check for transition class
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass('dark');

    // Verify transition is smooth (CSS should handle this)
    const transition = await page.evaluate(() => {
      const html = document.documentElement;
      return window.getComputedStyle(html).transition;
    });

    expect(transition).toContain('background-color');
  });

  test('should work for guest users', async ({ page, loginAsGuest }) => {
    await loginAsGuest();

    // Guest should be able to toggle theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass('dark');

    // Theme should persist for guest
    await page.reload();
    await expect(page.locator('html')).toHaveClass('dark');
  });

  test('should update theme toggle state correctly', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Check initial state
    await expect(page.locator('[data-testid="theme-toggle"]')).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    // Toggle to dark
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('[data-testid="theme-toggle"]')).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Toggle back to light
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('[data-testid="theme-toggle"]')).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  test('should handle theme toggle keyboard navigation', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Focus on theme toggle
    await page.focus('[data-testid="theme-toggle"]');

    // Press Enter to toggle
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass('dark');

    // Press Space to toggle back
    await page.keyboard.press(' ');
    await expect(page.locator('html')).not.toHaveClass('dark');
  });

  test('should show theme preference in user menu', async ({
    page,
    loginAsUser,
  }) => {
    await loginAsUser();

    // Open user menu
    await page.click('[data-testid="user-menu"]');

    // Should show current theme
    await expect(page.locator('[data-testid="current-theme"]')).toContainText(
      'Light'
    );

    // Toggle theme
    await page.click('[data-testid="theme-toggle"]');
    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="current-theme"]')).toContainText(
      'Dark'
    );
  });
});
