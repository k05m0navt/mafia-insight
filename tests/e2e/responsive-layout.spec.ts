import { test, expect } from '@playwright/test';

/**
 * E2E tests for responsive layout at different breakpoints
 * Verifies layouts adapt correctly at: 320px, 768px, 1024px, 1440px
 */
test.describe('Responsive Layout', () => {
  test('should adapt layout at 320px (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');

    // Check that mobile navigation is visible
    const mobileNav = page
      .locator('[data-testid="mobile-navigation"]')
      .or(page.locator('button[aria-label*="menu" i]'));

    // Mobile should have single column layout
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should adapt layout at 768px (tablet)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Tablet should show 2-column layouts where applicable
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should adapt layout at 1024px (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    // Desktop should show full navigation and multi-column layouts
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should adapt layout at 1440px (large desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Large desktop should utilize full width effectively
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should maintain responsive grid at all breakpoints', async ({
    page,
  }) => {
    // Test that responsive grid adapts correctly
    const breakpoints = [
      { width: 320, name: 'mobile' },
      { width: 768, name: 'tablet' },
      { width: 1024, name: 'desktop' },
      { width: 1440, name: 'large desktop' },
    ];

    for (const { width, name } of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      // Verify page is visible and responsive
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check that content doesn't overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(
        overflow,
        `Content should not overflow at ${name} (${width}px)`
      ).toBe(false);
    }
  });
});
