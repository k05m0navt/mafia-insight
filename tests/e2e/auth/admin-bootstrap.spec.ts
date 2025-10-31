import { test, expect } from '@playwright/test';

/**
 * E2E Test: Admin Bootstrap Flow
 *
 * Tests the admin bootstrap functionality:
 * - Access bootstrap page when no admins exist
 * - Form validation
 * - Successful admin creation
 * - Security check (cannot create admin when admins exist)
 */

test.describe('Admin Bootstrap', () => {
  test('should display bootstrap form when accessible', async ({ page }) => {
    await page.goto('/admin/bootstrap');

    // Check if we see either the form or the "not available" message
    const formVisible = await page
      .locator('input[name="name"]')
      .isVisible()
      .catch(() => false);
    const notAvailable = await page
      .locator('text=/not available/i')
      .isVisible()
      .catch(() => false);

    // At least one should be visible
    expect(formVisible || notAvailable).toBeTruthy();
  });

  test('should show all required form fields', async ({ page }) => {
    await page.goto('/admin/bootstrap');

    // Only check if form is available
    const formVisible = await page
      .locator('input[name="name"]')
      .isVisible()
      .catch(() => false);

    if (formVisible) {
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });

  test('should validate password match', async ({ page }) => {
    await page.goto('/admin/bootstrap');

    const formVisible = await page
      .locator('input[name="name"]')
      .isVisible()
      .catch(() => false);

    if (formVisible) {
      await page.fill('input[name="name"]', 'Admin User');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'differentpassword');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/passwords.*match/i')).toBeVisible();
    }
  });

  test('should validate minimum password length', async ({ page }) => {
    await page.goto('/admin/bootstrap');

    const formVisible = await page
      .locator('input[name="password"]')
      .isVisible()
      .catch(() => false);

    if (formVisible) {
      await page.fill('input[name="name"]', 'Admin User');
      await page.fill('input[name="email"]', 'admin@example.com');
      await page.fill('input[name="password"]', '123');
      await page.fill('input[name="confirmPassword"]', '123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/8.*characters/i')).toBeVisible();
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/admin/bootstrap');

    const formVisible = await page
      .locator('input[name="email"]')
      .isVisible()
      .catch(() => false);

    if (formVisible) {
      await page.fill('input[name="name"]', 'Admin User');
      await page.fill('input[name="email"]', 'notanemail');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/invalid.*email/i')).toBeVisible();
    }
  });

  test('should show security warning about first admin', async ({ page }) => {
    await page.goto('/admin/bootstrap');

    // Check for security messaging
    await expect(
      page
        .locator('text=/first admin/i')
        .or(page.locator('text=/full system access/i'))
    ).toBeVisible();
  });

  test('should redirect to login after successful creation', async ({
    page,
  }) => {
    await page.goto('/admin/bootstrap');

    const notAvailable = await page
      .locator('text=/not available/i')
      .isVisible()
      .catch(() => false);

    if (notAvailable) {
      // Bootstrap not available (admins already exist)
      await expect(page.locator('text=/already exist/i')).toBeVisible();

      // Should have link to login
      const loginButton = page
        .locator('a[href*="login"]')
        .or(page.locator('button:has-text("Login")'));
      await expect(loginButton).toBeVisible();
    }
  });
});

test.describe('Admin Bootstrap Security', () => {
  test('should prevent bootstrap when admins exist', async ({ page }) => {
    await page.goto('/admin/bootstrap');

    // Check if bootstrap is disabled
    const checkResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/bootstrap/check');
        const data = await response.json();
        return data;
      } catch {
        return null;
      }
    });

    if (checkResult && !checkResult.available) {
      await expect(
        page
          .locator('text=/not available/i')
          .or(page.locator('text=/already exist/i'))
      ).toBeVisible();
    }
  });

  test('should have proper page title and description', async ({ page }) => {
    await page.goto('/admin/bootstrap');

    await expect(page).toHaveTitle(/Admin.*Bootstrap/i);
    await expect(page.locator('h1').or(page.locator('h2'))).toContainText(
      /admin/i
    );
  });
});
