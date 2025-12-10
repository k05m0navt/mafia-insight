import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility compliance tests using axe-core
 * Verifies WCAG 2.1 Level AA compliance
 */
test.describe('Accessibility Compliance', () => {
  test('should have no accessibility violations on home page', async ({
    page,
  }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper color contrast ratios', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    // Filter only color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/');

    // Check that interactive elements are keyboard accessible
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['keyboard', 'focus-order-semantics', 'focusable-content'])
      .analyze();

    const keyboardViolations = accessibilityScanResults.violations.filter((v) =>
      ['keyboard', 'focus-order-semantics', 'focusable-content'].includes(v.id)
    );

    expect(keyboardViolations).toEqual([]);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules([
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-roles',
        'aria-valid-attr-value',
      ])
      .analyze();

    const ariaViolations = accessibilityScanResults.violations.filter((v) =>
      [
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-roles',
        'aria-valid-attr-value',
      ].includes(v.id)
    );

    expect(ariaViolations).toEqual([]);
  });

  test('should have focus indicators on interactive elements', async ({
    page,
  }) => {
    await page.goto('/');

    // Find all interactive elements
    const buttons = await page.locator('button').all();
    const links = await page.locator('a[href]').all();
    const inputs = await page.locator('input, select, textarea').all();

    const allInteractive = [...buttons, ...links, ...inputs];

    for (const element of allInteractive) {
      // Focus the element
      await element.focus();

      // Check if element has focus styles
      const focusedStyles = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow,
        };
      });

      // Element should have some form of focus indicator
      const hasFocusIndicator =
        focusedStyles.outline !== 'none' ||
        focusedStyles.outlineWidth !== '0px' ||
        focusedStyles.boxShadow !== 'none';

      expect(
        hasFocusIndicator,
        `Element should have focus indicator: ${await element.evaluate((el) => el.outerHTML)}`
      ).toBe(true);
    }
  });

  test('should be screen reader compatible', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules([
        'aria-hidden-focus',
        'aria-required-children',
        'aria-required-parent',
        'button-name',
        'document-title',
        'html-has-lang',
        'image-alt',
        'label',
        'link-name',
      ])
      .analyze();

    const screenReaderViolations = accessibilityScanResults.violations.filter(
      (v) =>
        [
          'aria-hidden-focus',
          'aria-required-children',
          'aria-required-parent',
          'button-name',
          'document-title',
          'html-has-lang',
          'image-alt',
          'label',
          'link-name',
        ].includes(v.id)
    );

    expect(screenReaderViolations).toEqual([]);
  });

  test('should meet WCAG 2.1 Level AA compliance', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Report violations if any
    if (accessibilityScanResults.violations.length > 0) {
      console.error('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.error(`- ${violation.id}: ${violation.description}`);
        violation.nodes.forEach((node) => {
          console.error(`  - ${node.html}`);
        });
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
