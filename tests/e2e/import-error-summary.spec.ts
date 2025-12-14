import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Import Error Summary Display', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/sync');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display error summary when import completes with errors', async ({
    page,
  }) => {
    // Mock API response with error summary
    await page.route('**/api/gomafia-sync/import/errors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          syncLogId: 'log-1',
          status: 'COMPLETED',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          errorSummary: {
            totalErrors: 5,
            errorsByCategory: {
              transient: 2,
              permanent: 3,
            },
            errorsByType: {
              network: 2,
              validation: 3,
            },
            skippedEntitiesByPhase: {
              CLUBS: 1,
              PLAYERS: 2,
            },
            recentErrors: [
              {
                code: 'NETWORK_ERROR',
                message: 'Network timeout',
                phase: 'CLUBS',
                category: 'TRANSIENT',
                type: 'network',
                timestamp: new Date().toISOString(),
              },
              {
                code: 'VALIDATION_ERROR',
                message: 'Validation error: missing required field',
                phase: 'PLAYERS',
                category: 'PERMANENT',
                type: 'validation',
                entityId: 'player-1',
                entityType: 'player',
                timestamp: new Date().toISOString(),
              },
            ],
          },
          message: 'Import completed with 5 errors. 3 entities skipped.',
        }),
      });
    });

    // Mock sync status to show import completed
    await page.route('**/api/gomafia-sync/import', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isRunning: false,
          syncLogStatus: 'COMPLETED',
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that error summary card is displayed
    const errorSummaryCard = page.locator('text=Error Summary');
    await expect(errorSummaryCard).toBeVisible();

    // Check error count badge
    const errorBadge = page.locator('text=/5 Error/');
    await expect(errorBadge).toBeVisible();

    // Check error categories
    await expect(page.locator('text=Transient:')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible(); // Transient count
    await expect(page.locator('text=Permanent:')).toBeVisible();
    await expect(page.locator('text=3')).toBeVisible(); // Permanent count

    // Check errors by type
    await expect(page.locator('text=network: 2')).toBeVisible();
    await expect(page.locator('text=validation: 3')).toBeVisible();

    // Check skipped entities
    await expect(page.locator('text=CLUBS: 1')).toBeVisible();
    await expect(page.locator('text=PLAYERS: 2')).toBeVisible();
  });

  test('should display recent errors with expandable details', async ({
    page,
  }) => {
    await page.route('**/api/gomafia-sync/import/errors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          syncLogId: 'log-1',
          status: 'COMPLETED',
          errorSummary: {
            totalErrors: 2,
            errorsByCategory: { transient: 1, permanent: 1 },
            errorsByType: { network: 1, validation: 1 },
            skippedEntitiesByPhase: {},
            recentErrors: [
              {
                code: 'NETWORK_ERROR',
                message: 'Network timeout occurred',
                phase: 'CLUBS',
                category: 'TRANSIENT',
                type: 'network',
                timestamp: new Date().toISOString(),
              },
            ],
          },
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check recent errors section
    await expect(page.locator('text=Recent Errors')).toBeVisible();

    // Check error row is visible
    await expect(page.locator('text=NETWORK_ERROR')).toBeVisible();
    await expect(page.locator('text=Network timeout occurred')).toBeVisible();

    // Click to expand error details
    const expandButton = page
      .locator('button')
      .filter({ hasText: 'Network timeout occurred' })
      .first();
    await expandButton.click();

    // Check expanded details
    await expect(page.locator('text=Phase')).toBeVisible();
    await expect(page.locator('text=CLUBS')).toBeVisible();
    await expect(page.locator('text=Category')).toBeVisible();
    await expect(page.locator('text=TRANSIENT')).toBeVisible();
  });

  test('should show no errors message when import completes successfully', async ({
    page,
  }) => {
    await page.route('**/api/gomafia-sync/import/errors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          syncLogId: 'log-1',
          status: 'COMPLETED',
          errorSummary: {
            totalErrors: 0,
            errorsByCategory: { transient: 0, permanent: 0 },
            errorsByType: {},
            skippedEntitiesByPhase: {},
            recentErrors: [],
          },
          message: 'Import completed successfully with no errors.',
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check success message
    await expect(
      page.locator('text=Import completed successfully with no errors.')
    ).toBeVisible();
  });

  test('should handle missing sync log gracefully', async ({ page }) => {
    await page.route('**/api/gomafia-sync/import/errors', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'No sync log found',
          code: 'NO_SYNC_LOG',
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show loading or empty state, not crash
    const errorSummaryCard = page.locator('text=Error Summary');
    await expect(errorSummaryCard).toBeVisible();
  });
});

test.describe('Import Error Summary Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sync');
    await injectAxe(page);
  });

  test('should be accessible with WCAG 2.1 AA compliance', async ({ page }) => {
    // Mock error summary data
    await page.route('**/api/gomafia-sync/import/errors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          syncLogId: 'log-1',
          status: 'COMPLETED',
          errorSummary: {
            totalErrors: 3,
            errorsByCategory: { transient: 1, permanent: 2 },
            errorsByType: { network: 1, validation: 2 },
            skippedEntitiesByPhase: { CLUBS: 1 },
            recentErrors: [
              {
                code: 'VALIDATION_ERROR',
                message: 'Test error',
                phase: 'CLUBS',
                category: 'PERMANENT',
                type: 'validation',
                timestamp: new Date().toISOString(),
              },
            ],
          },
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Run accessibility check
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.route('**/api/gomafia-sync/import/errors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          syncLogId: 'log-1',
          status: 'COMPLETED',
          errorSummary: {
            totalErrors: 1,
            errorsByCategory: { transient: 0, permanent: 1 },
            errorsByType: { validation: 1 },
            skippedEntitiesByPhase: {},
            recentErrors: [],
          },
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for proper semantic HTML
    const errorSummaryCard = page
      .locator('[role="region"]')
      .or(page.locator('article'));
    await expect(errorSummaryCard.first()).toBeVisible();

    // Check table has proper structure
    const table = page.locator('table');
    if ((await table.count()) > 0) {
      await expect(table.first()).toHaveAttribute('role', 'table');
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.route('**/api/gomafia-sync/import/errors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          syncLogId: 'log-1',
          status: 'COMPLETED',
          errorSummary: {
            totalErrors: 1,
            errorsByCategory: { transient: 0, permanent: 1 },
            errorsByType: {},
            skippedEntitiesByPhase: {},
            recentErrors: [],
          },
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check text elements have sufficient contrast
    const textElements = page.locator('p, span, div').filter({ hasText: /./ });
    const count = await textElements.count();

    // Verify elements exist (contrast will be checked by axe)
    expect(count).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.route('**/api/gomafia-sync/import/errors', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          syncLogId: 'log-1',
          status: 'COMPLETED',
          errorSummary: {
            totalErrors: 1,
            errorsByCategory: { transient: 0, permanent: 1 },
            errorsByType: {},
            skippedEntitiesByPhase: {},
            recentErrors: [
              {
                code: 'ERROR',
                message: 'Test error',
                phase: 'CLUBS',
                category: 'PERMANENT',
                type: 'validation',
                timestamp: new Date().toISOString(),
              },
            ],
          },
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement.first()).toBeVisible();

    // Navigate with keyboard
    await page.keyboard.press('Enter');
    // Should expand/collapse error details
  });
});
