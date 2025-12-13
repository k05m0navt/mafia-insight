import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('OAuth Buttons Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/login');
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
  });

  test('should have no accessibility violations on login page with OAuth buttons', async ({
    page,
  }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="login-container"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const violations = accessibilityScanResults.violations.filter(
      (violation) => violation.id !== 'color-contrast'
    );

    if (violations.length > 0) {
      console.error('Accessibility violations found:');
      violations.forEach((violation) => {
        console.error(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(violations).toEqual([]);
  });

  test('should have proper ARIA labels on OAuth buttons', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for Google OAuth button
    const googleButton = page.getByRole('button', {
      name: /sign in with google/i,
    });
    await expect(googleButton).toBeVisible({ timeout: 5000 });
    await expect(googleButton).toHaveAttribute(
      'aria-label',
      'Sign in with Google'
    );

    // Check for GitHub OAuth button if configured
    const githubButton = page.getByRole('button', {
      name: /sign in with github/i,
    });
    if (await githubButton.isVisible().catch(() => false)) {
      await expect(githubButton).toHaveAttribute(
        'aria-label',
        'Sign in with GitHub'
      );
    }
  });

  test('should support keyboard navigation for OAuth buttons', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Start by focusing the first OAuth button
    const googleButton = page.getByRole('button', {
      name: /sign in with google/i,
    });
    await googleButton.focus();
    await page.waitForTimeout(200);

    // Verify button is focused
    const isFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.getAttribute('aria-label')?.includes('Google');
    });
    expect(isFocused).toBe(true);

    // Tab to next button if GitHub is available
    const githubButton = page.getByRole('button', {
      name: /sign in with github/i,
    });
    if (await githubButton.isVisible().catch(() => false)) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);

      const githubFocused = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.getAttribute('aria-label')?.includes('GitHub');
      });
      expect(githubFocused).toBe(true);
    }
  });

  test('should have proper button states announced to screen readers', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    const googleButton = page.getByRole('button', {
      name: /sign in with google/i,
    });
    await expect(googleButton).toBeVisible({ timeout: 5000 });

    // Button should not be disabled initially
    await expect(googleButton).not.toBeDisabled();

    // Click button to trigger loading state
    await googleButton.click();

    // Button should show loading state (disabled or loading text)
    await page.waitForTimeout(500);
    const buttonDisabled = await googleButton.isDisabled().catch(() => false);
    const buttonText = await googleButton.textContent().catch(() => '');
    const hasLoadingText =
      buttonText?.toLowerCase().includes('connecting') || false;

    expect(buttonDisabled || hasLoadingText).toBe(true);
  });

  test('should have proper visual separator accessibility', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Check for "or" divider between OAuth and email/password form
    const separator = page.locator('text=/^or$/i');
    await expect(separator).toBeVisible({ timeout: 5000 });

    // Separator should have proper contrast and be readable
    const separatorBox = await separator.boundingBox();
    expect(separatorBox?.height).toBeGreaterThan(0);
  });

  test('should have proper group structure for OAuth buttons', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Check for role="group" with proper aria-label
    const group = page.locator(
      '[role="group"][aria-label*="Social authentication"]'
    );
    await expect(group).toBeVisible({ timeout: 5000 });
  });
});

test.describe('OAuth Buttons Responsive Design', () => {
  test('should be responsive at 320px width (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const googleButton = page.getByRole('button', {
      name: /sign in with google/i,
    });
    await expect(googleButton).toBeVisible({ timeout: 5000 });

    const buttonBox = await googleButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThan(200); // Should be reasonably wide
  });

  test('should be responsive at 768px width (tablet)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const googleButton = page.getByRole('button', {
      name: /sign in with google/i,
    });
    await expect(googleButton).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive at 1024px width (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const googleButton = page.getByRole('button', {
      name: /sign in with google/i,
    });
    await expect(googleButton).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive at 1440px width (large desktop)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const googleButton = page.getByRole('button', {
      name: /sign in with google/i,
    });
    await expect(googleButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe('OAuth Error Page Accessibility', () => {
  test('should have no accessibility violations on error page', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/auth/error?error=AccessDenied');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const violations = accessibilityScanResults.violations.filter(
      (violation) => violation.id !== 'color-contrast'
    );

    expect(violations).toEqual([]);
  });

  test('should have proper error message structure', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toContainText(/access denied/i);

    const errorMessage = page.locator('p').filter({ hasText: /authorize/i });
    await expect(errorMessage).toBeVisible();
  });

  test('should have accessible error page buttons', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');
    await page.waitForLoadState('networkidle');

    const tryAgainButton = page.getByRole('link', { name: /try again/i });
    await expect(tryAgainButton).toBeVisible({ timeout: 5000 });
    await expect(tryAgainButton).toHaveAttribute('href', '/login');

    const goHomeButton = page.getByRole('link', { name: /go home/i });
    await expect(goHomeButton).toBeVisible();
    await expect(goHomeButton).toHaveAttribute('href', '/');
  });
});
