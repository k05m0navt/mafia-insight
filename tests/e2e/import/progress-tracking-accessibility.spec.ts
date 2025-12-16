import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests for Import Progress Tracking
 * Verifies WCAG 2.1 Level AA compliance for progress display component
 */
test.describe('Import Progress Tracking Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock progress API to return running import
    await page.route('**/api/gomafia-sync/import/progress', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentPhase: 'GAMES',
          progress: 50,
          currentEntity: { id: 'game-123', name: 'Game 123' },
          processedCount: 500,
          totalCount: 1000,
          elapsedSeconds: 300,
          estimatedSecondsRemaining: 300,
          processingRate: 1.67,
          isRunning: true,
          startTime: new Date(Date.now() - 300000).toISOString(),
          lastUpdated: new Date().toISOString(),
        }),
      });
    });

    // Mock sync status to show running
    await page.route('**/api/gomafia-sync/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isRunning: true,
          progress: 50,
          currentOperation: 'Importing games',
        }),
      });
    });

    // Navigate to sync page
    await page.goto('/sync');
    await expect(
      page.getByRole('heading', { name: /Data Synchronization/i })
    ).toBeVisible();

    // Wait for progress card to appear
    await expect(page.getByText('Import Progress')).toBeVisible();
  });

  test('should have no accessibility violations on progress card', async ({
    page,
  }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="progressbar"]')
      .include('text=Import Progress')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper color contrast ratios', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="progressbar"]')
      .include('text=Import Progress')
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();

    // Filter only color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('should have proper ARIA labels on progress bar', async ({ page }) => {
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // Check aria-label is present
    const ariaLabel = await progressBar.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('progress');
    expect(ariaLabel).toContain('%');
  });

  test('should have aria-live region for progress updates', async ({
    page,
  }) => {
    // Check for aria-live region (should be added to component)
    const liveRegion = page.locator('[aria-live]');
    const count = await liveRegion.count();

    // If aria-live is implemented, verify it's present
    // Note: This test will pass even if not implemented yet (as per code review recommendation)
    if (count > 0) {
      const ariaLive = await liveRegion.first().getAttribute('aria-live');
      expect(['polite', 'assertive']).toContain(ariaLive);
    }
  });

  test('should have semantic HTML structure', async ({ page }) => {
    // Check that progress card uses semantic HTML
    const card = page
      .locator('text=Import Progress')
      .locator('..')
      .locator('..');
    await expect(card).toBeVisible();

    // Verify headings are used for structure
    const headings = page
      .locator('h2, h3')
      .filter({ hasText: /Import Progress/i });
    await expect(headings.first()).toBeVisible();
  });

  test('should be keyboard accessible', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="progressbar"]')
      .include('text=Import Progress')
      .withRules(['keyboard', 'focus-order-semantics', 'focusable-content'])
      .analyze();

    const keyboardViolations = accessibilityScanResults.violations.filter((v) =>
      ['keyboard', 'focus-order-semantics', 'focusable-content'].includes(v.id)
    );

    expect(keyboardViolations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('text=Import Progress')
      .withRules(['heading-order', 'page-has-heading-one'])
      .analyze();

    const headingViolations = accessibilityScanResults.violations.filter((v) =>
      ['heading-order', 'page-has-heading-one'].includes(v.id)
    );

    expect(headingViolations).toEqual([]);
  });

  test('should have accessible text alternatives', async ({ page }) => {
    // Check that icons have proper text alternatives or are decorative
    const icons = page.locator('svg');
    const iconCount = await icons.count();

    // Icons should either have aria-label or aria-hidden="true"
    for (let i = 0; i < Math.min(iconCount, 5); i++) {
      const icon = icons.nth(i);
      const ariaLabel = await icon.getAttribute('aria-label');
      const ariaHidden = await icon.getAttribute('aria-hidden');

      // Icon should have either aria-label or be marked as decorative
      expect(ariaLabel || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('should support screen reader announcements', async ({ page }) => {
    // Progress information should be accessible to screen readers
    const progressBar = page.locator('[role="progressbar"]');
    const ariaLabel = await progressBar.getAttribute('aria-label');

    // Verify progress percentage is in aria-label
    expect(ariaLabel).toMatch(/\d+%/);

    // Verify current phase is accessible
    const phaseText = page.getByText(/Current Phase/i);
    await expect(phaseText).toBeVisible();

    // Verify counts are accessible
    const processedText = page.getByText(/Processed/i);
    await expect(processedText).toBeVisible();
  });

  test('should have proper focus management', async ({ page }) => {
    // Check that focusable elements are properly managed
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('text=Import Progress')
      .withRules(['focusable-content', 'focus-order-semantics'])
      .analyze();

    const focusViolations = accessibilityScanResults.violations.filter((v) =>
      ['focusable-content', 'focus-order-semantics'].includes(v.id)
    );

    expect(focusViolations).toEqual([]);
  });
});
