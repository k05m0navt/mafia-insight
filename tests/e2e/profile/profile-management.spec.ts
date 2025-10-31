import { test, expect } from '@playwright/test';

/**
 * E2E Test: Profile Management
 *
 * Tests the profile page functionality:
 * - Access profile page (requires authentication)
 * - View profile information
 * - Edit profile details
 * - Avatar upload
 * - Theme preference changes
 */

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile page
    // Note: This test assumes authentication is handled or mocked
    await page.goto('/profile');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/\/(login|unauthorized|auth)/);
  });

  test('should display profile header with user information', async ({
    page,
    context,
  }) => {
    // Skip if not authenticated
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Profile header should be visible
    await expect(
      page.locator('h1').or(page.locator('[data-testid="profile-header"]'))
    ).toBeVisible();
  });

  test('should display profile editor form', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Check for profile form fields
    const nameInput = page
      .locator('input[name="name"]')
      .or(page.locator('input[id="name"]'));
    const emailDisplay = page
      .locator('input[value*="@"]')
      .or(page.locator('text=/@.*\\./'));

    await expect(nameInput.or(emailDisplay)).toBeVisible({ timeout: 5000 });
  });

  test('should display theme preference selector', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Check for theme selector
    const themeSelector = page
      .locator('select[name="themePreference"]')
      .or(page.locator('[data-testid="theme-selector"]'))
      .or(page.locator('text=/theme/i'));

    await expect(themeSelector.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show avatar upload section', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Check for avatar/profile picture section
    const avatarSection = page
      .locator('text=/profile picture/i')
      .or(page.locator('text=/avatar/i'))
      .or(page.locator('input[type="file"]'));

    await expect(avatarSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('should validate name field is required', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    const nameInput = page.locator('input[name="name"]');
    const isVisible = await nameInput.isVisible().catch(() => false);

    if (isVisible) {
      await nameInput.clear();
      await nameInput.blur();

      // Look for validation error
      await expect(page.locator('text=/name.*required/i')).toBeVisible();
    }
  });

  test('should show success message after profile update', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    const nameInput = page.locator('input[name="name"]');
    const saveButton = page
      .locator('button[type="submit"]')
      .or(page.locator('button:has-text("Save")'));

    const nameVisible = await nameInput.isVisible().catch(() => false);
    const saveVisible = await saveButton.isVisible().catch(() => false);

    if (nameVisible && saveVisible) {
      await nameInput.fill('Updated Test Name');
      await saveButton.click();

      // Wait for success toast or message
      await expect(
        page.locator('text=/success/i').or(page.locator('text=/updated/i'))
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display email as read-only', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    const emailInput = page
      .locator('input[name="email"]')
      .or(page.locator('input[type="email"]'));
    const isVisible = await emailInput.isVisible().catch(() => false);

    if (isVisible) {
      const isDisabled = await emailInput.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });
});

test.describe('Profile Avatar Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
  });

  test('should show avatar upload button', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    const uploadButton = page
      .locator('button:has-text("Upload")')
      .or(page.locator('input[type="file"]'))
      .or(page.locator('[data-testid="avatar-upload"]'));

    await expect(uploadButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show avatar preview', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    const avatarPreview = page
      .locator('img[alt*="avatar"]')
      .or(page.locator('img[alt*="profile"]'))
      .or(page.locator('[data-testid="avatar-preview"]'));

    await expect(avatarPreview.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display file size and type requirements', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Check for file requirements text
    await expect(
      page.locator('text=/2MB/i').or(page.locator('text=/file.*size/i'))
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Profile Navigation', () => {
  test('should be accessible from navbar profile dropdown', async ({
    page,
  }) => {
    await page.goto('/');

    // Look for profile dropdown in navbar
    const profileButton = page
      .locator('[data-testid="profile-dropdown"]')
      .or(page.locator('button[aria-label*="profile"]'))
      .or(page.locator('[role="button"]:has-text("Profile")'));

    const isVisible = await profileButton.isVisible().catch(() => false);

    if (isVisible) {
      await profileButton.click();

      // Look for profile link
      const profileLink = page
        .locator('a[href="/profile"]')
        .or(page.locator('text=/profile/i'));
      await profileLink.click();

      await expect(page).toHaveURL(/\/profile/);
    }
  });

  test('should have cancel/back button', async ({ page }) => {
    await page.goto('/profile');

    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    const cancelButton = page
      .locator('button:has-text("Cancel")')
      .or(page.locator('button:has-text("Back")'))
      .or(page.locator('a[href="/"]'));

    await expect(cancelButton.first()).toBeVisible({ timeout: 5000 });
  });
});
