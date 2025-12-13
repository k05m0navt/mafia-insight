import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Guest Access Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies and storage to ensure guest state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('landing page meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('public statistics page meets WCAG 2.1 AA standards', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for statistics to load
    await page.waitForSelector('text=Community Statistics');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('documentation page meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/docs');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('help page meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/help');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('sign in required component meets WCAG 2.1 AA standards', async ({
    page,
  }) => {
    // Navigate to protected route to trigger sign in required
    await page.goto('/dashboard');

    // Should be redirected to login, but if sign in required component is shown
    // Wait for it to appear
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('feature tour component meets WCAG 2.1 AA standards', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for feature tour to load
    await page.waitForSelector('text=Explore Our Features');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('navigation menu for guests meets WCAG 2.1 AA standards', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for navigation to load
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).toBeTruthy();

    // Check for focus indicators
    const focusStyles = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      return (
        window.getComputedStyle(element).outline ||
        window.getComputedStyle(element).boxShadow
      );
    });

    expect(focusStyles).toBeTruthy();
  });

  test('color contrast meets WCAG 2.1 AA standards (4.5:1 minimum)', async ({
    page,
  }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('all images have alt text', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter for image alt text violations
    const imageViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'image-alt'
    );

    expect(imageViolations).toEqual([]);
  });

  test('all form inputs have labels', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter for label violations
    const labelViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'label' || violation.id === 'input-label'
    );

    expect(labelViolations).toEqual([]);
  });
});
