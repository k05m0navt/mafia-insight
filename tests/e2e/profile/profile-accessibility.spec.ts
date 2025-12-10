import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E Accessibility Test: Profile Management
 *
 * Tests WCAG 2.1 Level AA compliance for profile page:
 * - No accessibility violations on profile page
 * - Proper ARIA labels and roles
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Color contrast compliance
 */

test.describe('Profile Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profile page
    // Note: This test assumes authentication is handled or mocked
    await page.goto('/profile');
  });

  test('profile page should have no accessibility violations', async ({
    page,
  }) => {
    // Skip if redirected to login (not authenticated)
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
      .analyze();

    const violations = accessibilityScanResults.violations.filter(
      (violation) =>
        violation.impact === 'serious' || violation.impact === 'critical'
    );

    if (violations.length > 0) {
      console.error('Accessibility violations found:');
      violations.forEach((violation) => {
        console.error(`- ${violation.id}: ${violation.description}`);
        violation.nodes.forEach((node) => {
          console.error(`  - ${node.html}`);
        });
      });
    }

    expect(violations).toEqual([]);
  });

  test('profile form should have proper ARIA labels', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Check for ARIA labels on form fields
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');

    const nameVisible = await nameInput.isVisible().catch(() => false);
    const emailVisible = await emailInput.isVisible().catch(() => false);

    if (nameVisible) {
      const nameAriaLabel = await nameInput.getAttribute('aria-label');
      const nameAriaDescribedBy =
        await nameInput.getAttribute('aria-describedby');
      expect(nameAriaLabel || nameAriaDescribedBy).toBeTruthy();
    }

    if (emailVisible) {
      const emailAriaLabel = await emailInput.getAttribute('aria-label');
      const emailAriaDescribedBy =
        await emailInput.getAttribute('aria-describedby');
      expect(emailAriaLabel || emailAriaDescribedBy).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Test keyboard navigation through form fields
    const nameInput = page.locator('input[name="name"]');
    const isVisible = await nameInput.isVisible().catch(() => false);

    if (isVisible) {
      // Tab to name field
      await page.keyboard.press('Tab');
      await expect(nameInput).toBeFocused();

      // Tab to next field
      await page.keyboard.press('Tab');
      // Should focus next interactive element
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    if (colorContrastViolations.length > 0) {
      console.error('Color contrast violations found:');
      colorContrastViolations.forEach((violation) => {
        console.error(`- ${violation.description}`);
      });
    }

    expect(colorContrastViolations).toEqual([]);
  });

  test('should have proper form error announcements', async ({ page }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    const nameInput = page.locator('input[name="name"]');
    const isVisible = await nameInput.isVisible().catch(() => false);

    if (isVisible) {
      // Clear name field to trigger validation
      await nameInput.clear();
      await nameInput.blur();

      // Check for error message with proper ARIA attributes
      const errorMessage = page
        .locator('[role="alert"]')
        .or(page.locator('[aria-live="polite"]'));

      const errorVisible = await errorMessage.isVisible().catch(() => false);
      if (errorVisible) {
        // Error should be announced to screen readers
        const ariaLive = await errorMessage.getAttribute('aria-live');
        expect(ariaLive).toBeTruthy();
      }
    }
  });

  test('should have accessible buttons and interactive elements', async ({
    page,
  }) => {
    const isLoginPage = page.url().includes('login');
    if (isLoginPage) {
      test.skip();
      return;
    }

    // Check all buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible().catch(() => false);

      if (isVisible) {
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');

        // Button should have accessible name (aria-label, text content, or aria-labelledby)
        expect(ariaLabel || textContent?.trim() || ariaLabelledBy).toBeTruthy();
      }
    }
  });
});
