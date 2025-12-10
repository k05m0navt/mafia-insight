import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Signup Form Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('should have no accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.error('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.error(`- ${violation.id}: ${violation.description}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(/create your account/i);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Check that all form fields have associated labels
    await expect(page.locator('label[for="name"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('label[for="confirmPassword"]')).toBeVisible();
  });

  test('should have proper ARIA labels on form fields', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="name"]')).toHaveAttribute(
      'aria-label',
      'Name',
      { timeout: 5000 }
    );
    await expect(page.locator('[data-testid="email"]')).toHaveAttribute(
      'aria-label',
      'Email'
    );
    await expect(page.locator('[data-testid="password"]')).toHaveAttribute(
      'aria-label',
      'Password'
    );
    await expect(
      page.locator('[data-testid="confirmPassword"]')
    ).toHaveAttribute('aria-label', 'Confirm Password');
  });

  test('should have proper ARIA labels on buttons', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="signup-button"]')).toHaveAttribute(
      'aria-label',
      'Sign Up',
      { timeout: 5000 }
    );
  });

  test('should have proper error message ARIA attributes', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Trigger validation error
    const emailInput = page.locator('[data-testid="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await page.waitForTimeout(500); // Wait for validation

    // Check that error messages have proper ARIA attributes
    const errorMessages = page.locator('[role="alert"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 2000 });
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Tab through form fields
    await page.keyboard.press('Tab'); // Name field
    await expect(page.locator('[data-testid="name"]:focus')).toBeVisible({
      timeout: 2000,
    });

    await page.keyboard.press('Tab'); // Email field
    await expect(page.locator('[data-testid="email"]:focus')).toBeVisible({
      timeout: 2000,
    });

    await page.keyboard.press('Tab'); // Password field
    await expect(page.locator('[data-testid="password"]:focus')).toBeVisible({
      timeout: 2000,
    });

    await page.keyboard.press('Tab'); // Confirm Password field
    await expect(
      page.locator('[data-testid="confirmPassword"]:focus')
    ).toBeVisible({ timeout: 2000 });

    await page.keyboard.press('Tab'); // Submit button
    await expect(
      page.locator('[data-testid="signup-button"]:focus')
    ).toBeVisible({ timeout: 2000 });
  });

  test('should support keyboard form submission', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Fill form using keyboard
    await page.keyboard.press('Tab'); // Focus name
    await page.waitForTimeout(100);
    await page.keyboard.type('Test User');

    await page.keyboard.press('Tab'); // Focus email
    await page.waitForTimeout(100);
    await page.keyboard.type('test@example.com');

    await page.keyboard.press('Tab'); // Focus password
    await page.waitForTimeout(100);
    await page.keyboard.type('Password123!');

    await page.keyboard.press('Tab'); // Focus confirm password
    await page.waitForTimeout(100);
    await page.keyboard.type('Password123!');

    await page.keyboard.press('Tab'); // Focus submit button
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter'); // Submit form

    // Form should be submitted (check for loading state or success message)
    await expect(
      page.locator('[data-testid="signup-button"]:disabled')
    ).toBeVisible({ timeout: 3000 });
  });

  test('should have proper focus management on validation errors', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');
    // Submit form with invalid data
    await page.locator('[data-testid="signup-button"]').click();

    // Wait for validation errors
    await page.waitForSelector('[role="alert"]', { timeout: 3000 });

    // First field with error should be focusable
    const firstErrorField = page.locator('[data-testid="name"]');
    await expect(firstErrorField).toBeVisible();
    await expect(firstErrorField).not.toBeDisabled();
  });

  test('should have proper color contrast for error messages', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');
    // Trigger validation error
    const emailInput = page.locator('[data-testid="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('invalid');
    await emailInput.blur();
    await page.waitForTimeout(500); // Wait for validation

    // Check error message styling
    const errorMessage = page.locator('[role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 2000 });

    // Check that error message has proper text color class
    const errorClass = await errorMessage.getAttribute('class');
    expect(errorClass).toContain('text-destructive');
  });

  test('should have proper form field descriptions', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Password field should have strength meter with requirements
    const passwordInput = page.locator('[data-testid="password"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill('Test');
    await page.waitForTimeout(300); // Wait for strength meter to update

    await expect(
      page.locator('[data-testid="password-strength-meter"]')
    ).toBeVisible({ timeout: 2000 });
    await expect(
      page.locator('[data-testid="password-requirements"]')
    ).toBeVisible({ timeout: 2000 });
  });

  test('should have proper button states announced to screen readers', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');
    const submitButton = page.locator('[data-testid="signup-button"]');
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });

    // Button should not be disabled initially
    await expect(submitButton).not.toBeDisabled();

    // Fill form and submit
    await page.locator('[data-testid="name"]').fill('Test User');
    await page.locator('[data-testid="email"]').fill('test@example.com');
    await page.locator('[data-testid="password"]').fill('Password123!');
    await page.locator('[data-testid="confirmPassword"]').fill('Password123!');
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled({ timeout: 3000 });
  });
});

test.describe('Signup Form Responsive Design', () => {
  test('should be responsive at 320px width (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Form should be visible and usable
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="name"]')).toBeVisible();
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmPassword"]')).toBeVisible();
    await expect(page.locator('[data-testid="signup-button"]')).toBeVisible();

    // Check that form fields are full width
    const nameInput = page.locator('[data-testid="name"]');
    const nameBox = await nameInput.boundingBox();
    expect(nameBox?.width).toBeGreaterThan(250); // Should be nearly full width
  });

  test('should be responsive at 768px width (tablet)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Form should be centered and properly sized
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible({
      timeout: 5000,
    });

    const container = page.locator('[data-testid="signup-container"]');
    const containerBox = await container.boundingBox();
    expect(containerBox?.width).toBeLessThanOrEqual(448); // max-w-md = 448px
  });

  test('should be responsive at 1024px width (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Form should be centered
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible({
      timeout: 5000,
    });

    const container = page.locator('[data-testid="signup-container"]');
    const containerBox = await container.boundingBox();
    expect(containerBox?.width).toBeLessThanOrEqual(448); // max-w-md = 448px
  });

  test('should be responsive at 1440px width (large desktop)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Form should be centered and not stretched
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible({
      timeout: 5000,
    });

    const container = page.locator('[data-testid="signup-container"]');
    const containerBox = await container.boundingBox();
    expect(containerBox?.width).toBeLessThanOrEqual(448); // max-w-md = 448px
  });

  test('should maintain proper spacing at all breakpoints', async ({
    page,
  }) => {
    const breakpoints = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
    ];

    for (const viewport of breakpoints) {
      await page.setViewportSize(viewport);
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      // Form should be visible and properly spaced
      await expect(page.locator('[data-testid="signup-form"]')).toBeVisible({
        timeout: 5000,
      });

      // Check that form fields have proper spacing
      const nameInput = page.locator('[data-testid="name"]');
      const emailInput = page.locator('[data-testid="email"]');

      const nameBox = await nameInput.boundingBox();
      const emailBox = await emailInput.boundingBox();

      if (nameBox && emailBox) {
        // Email should be below name with proper spacing
        expect(emailBox.y).toBeGreaterThan(nameBox.y + nameBox.height);
      }
    }
  });

  test('should have readable text at all breakpoints', async ({ page }) => {
    const breakpoints = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
    ];

    for (const viewport of breakpoints) {
      await page.setViewportSize(viewport);
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      // Heading should be visible and readable
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 5000 });

      const headingBox = await heading.boundingBox();
      expect(headingBox?.height).toBeGreaterThan(20); // Should be readable
    }
  });
});
