import { test, expect } from '@playwright/test';

test.describe('Guest Access Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies and storage to ensure guest state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('guest can access landing page', async ({ page }) => {
    await page.goto('/');

    // Should see landing page content
    await expect(
      page.getByRole('heading', { name: /mafia insight/i })
    ).toBeVisible();
  });

  test('guest can view public statistics', async ({ page }) => {
    await page.goto('/');

    // Should see public statistics section
    await expect(page.getByText(/community statistics/i)).toBeVisible();

    // Should see statistics cards
    await expect(page.getByText(/total players/i)).toBeVisible();
    await expect(page.getByText(/total games/i)).toBeVisible();
  });

  test('guest can access documentation pages', async ({ page }) => {
    await page.goto('/docs');

    // Should see documentation content
    await expect(
      page.getByRole('heading', { name: /documentation/i })
    ).toBeVisible();
  });

  test('guest can access help pages', async ({ page }) => {
    await page.goto('/help');

    // Should see help content
    await expect(page.getByRole('heading', { name: /help/i })).toBeVisible();
  });

  test('guest is redirected to login when accessing protected route', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);

    // Should have return URL in query params
    const url = page.url();
    expect(url).toContain('from=');
  });

  test('guest is redirected to login when accessing profile', async ({
    page,
  }) => {
    await page.goto('/profile');

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain('from=');
  });

  test('guest sees sign in and sign up buttons in navigation', async ({
    page,
  }) => {
    await page.goto('/');

    // Should see sign in button
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();

    // Should see sign up button
    await expect(
      page.getByRole('link', { name: /sign up|create account/i })
    ).toBeVisible();
  });

  test('guest preferences persist during session', async ({ page }) => {
    await page.goto('/');

    // Set theme preference (this would be done through UI in real scenario)
    await page.evaluate(() => {
      const prefs = { theme: 'dark' };
      sessionStorage.setItem('guest_preferences', JSON.stringify(prefs));
    });

    // Navigate to another page
    await page.goto('/docs');

    // Preference should still be in session storage
    const prefs = await page.evaluate(() => {
      const stored = sessionStorage.getItem('guest_preferences');
      return stored ? JSON.parse(stored) : null;
    });

    expect(prefs).toEqual({ theme: 'dark' });
  });

  test('guest can view feature tour', async ({ page }) => {
    await page.goto('/');

    // Should see feature tour section
    await expect(page.getByText(/explore our features/i)).toBeVisible();

    // Should see feature cards
    await expect(page.getByText(/player analytics/i)).toBeVisible();
    await expect(page.getByText(/performance trends/i)).toBeVisible();
  });

  test('guest can interact with feature tour', async ({ page }) => {
    await page.goto('/');

    // Click on a feature card
    const analyticsCard = page
      .getByText(/player analytics/i)
      .locator('..')
      .locator('..');
    await analyticsCard.click();

    // Should see sample data
    await expect(page.getByText(/sample data/i)).toBeVisible();
  });

  test('complete guest journey: landing -> public stats -> protected route -> sign-in', async ({
    page,
  }) => {
    // Step 1: Visit landing page
    await page.goto('/');
    await expect(page.getByText(/community statistics/i)).toBeVisible();

    // Step 2: View public statistics
    await expect(page.getByText(/total players/i)).toBeVisible();

    // Step 3: Try to access dashboard (protected route)
    await page.goto('/dashboard');

    // Step 4: Should be redirected to sign-in
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain('from=/dashboard');
  });

  test('guest preferences are cleared when session ends', async ({
    page,
    context,
  }) => {
    await page.goto('/');

    // Set preferences
    await page.evaluate(() => {
      sessionStorage.setItem(
        'guest_preferences',
        JSON.stringify({ theme: 'dark', language: 'ru' })
      );
    });

    // Close and reopen context (simulates session end)
    await context.close();
    const newContext = await page.context().browser()?.newContext();
    const newPage = await newContext?.newPage();

    if (newPage) {
      await newPage.goto('/');

      // Preferences should be cleared
      const prefs = await newPage.evaluate(() => {
        return sessionStorage.getItem('guest_preferences');
      });

      expect(prefs).toBeNull();
    }
  });
});
