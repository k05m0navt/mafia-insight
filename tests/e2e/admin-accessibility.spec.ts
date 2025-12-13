import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Admin Pages Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up admin authentication cookie
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'test-admin-token',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'user-role',
        value: 'admin',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('admin users management page meets WCAG 2.1 AA standards', async ({
    page,
  }) => {
    await page.goto('/admin/users');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('admin audit log page meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/admin/audit-log');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('admin pages work on mobile devices with proper touch targets', async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Check that interactive elements have minimum 44x44px touch targets
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Check search input is accessible
    const searchInput = await page.$(
      'input[type="search"], input[placeholder*="search" i]'
    );
    expect(searchInput).toBeTruthy();
  });

  test('admin user management flow is accessible', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Check that table is accessible
    const table = await page.$('table');
    expect(table).toBeTruthy();

    // Check that search input has proper label
    const searchInput = await page.$(
      'input[type="search"], input[placeholder*="search" i]'
    );
    if (searchInput) {
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const placeholder = await searchInput.getAttribute('placeholder');
      expect(ariaLabel || placeholder).toBeTruthy();
    }

    // Check that role filter has proper label
    const roleFilter = await page.$('select, [role="combobox"]');
    if (roleFilter) {
      const ariaLabel = await roleFilter.getAttribute('aria-label');
      const label = await page.$('label[for*="role" i]');
      expect(ariaLabel || label).toBeTruthy();
    }

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('role change dialog is accessible', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Find and click a role selector (if available)
    const roleSelectors = await page.$$('[role="combobox"]');
    if (roleSelectors.length > 0) {
      await roleSelectors[0].click();

      // Wait for dialog or dropdown to appear
      await page.waitForTimeout(500);

      // Check dialog accessibility
      const dialog = await page.$('[role="dialog"]');
      if (dialog) {
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      }
    }
  });
});
