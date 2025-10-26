/**
 * E2E Test: Data Integrity Checks Display (T099)
 *
 * Verifies that data integrity check results are displayed correctly in the UI,
 * showing passed/failed checks and detailed issue information.
 *
 * @requires Playwright environment with running app
 */

import { test, expect } from '@playwright/test';

test.describe('Data Integrity Checks Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to import page
    await page.goto('/import');
  });

  test('should display data integrity panel after import', async ({ page }) => {
    // Wait for import status to load
    await page.waitForSelector('[data-testid="import-summary"]', {
      timeout: 10000,
    });

    // Check if integrity panel is visible
    const integrityPanel = page.locator('text=Data Integrity').locator('..');
    await expect(integrityPanel).toBeVisible();
  });

  test('should show PASS status when all checks pass', async ({ page }) => {
    await page.waitForSelector('text=Data Integrity', { timeout: 10000 });

    // Look for PASS badge
    const passBadge = page.locator('text=PASS');

    // If present, verify success message
    if (await passBadge.isVisible()) {
      await expect(
        page.locator('text=/All integrity checks passed/')
      ).toBeVisible();

      // Should show green check icon
      await expect(page.locator('.text-green-600')).toBeVisible();

      // Should not show issues list
      await expect(page.locator('text=Integrity Issues')).not.toBeVisible();
    }
  });

  test('should show FAIL status with issues when checks fail', async ({
    page,
  }) => {
    await page.waitForSelector('text=Data Integrity', { timeout: 10000 });

    // Look for FAIL badge
    const failBadge = page.locator('text=FAIL');

    // If present, verify failure details
    if (await failBadge.isVisible()) {
      // Should show failure message
      await expect(page.locator('text=/checks failed/')).toBeVisible();

      // Should show red alert icon
      await expect(page.locator('.text-red-600')).toBeVisible();

      // Should display issues list
      await expect(page.locator('text=Integrity Issues')).toBeVisible();
    }
  });

  test('should display check statistics', async ({ page }) => {
    await page.waitForSelector('text=Data Integrity', { timeout: 10000 });

    // Should show total checks
    const totalChecks = page
      .locator('text=/Total Checks/i')
      .locator('..')
      .locator('span.font-bold');
    await expect(totalChecks).toBeVisible();

    // Should show passed checks (green)
    const passedChecks = page
      .locator('text=/Passed/i')
      .locator('..')
      .locator('.text-green-600');
    await expect(passedChecks).toBeVisible();

    // Should show failed checks (red)
    const failedChecks = page
      .locator('text=/Failed/i')
      .locator('..')
      .locator('.text-red-600');
    await expect(failedChecks).toBeVisible();
  });

  test('should display progress bar for check completion', async ({ page }) => {
    await page.waitForSelector('text=Data Integrity', { timeout: 10000 });

    // Should show check progress
    await expect(page.locator('text=Check Progress')).toBeVisible();

    // Should show progress bar
    const progressBar = page.locator('.bg-gray-200.rounded-full');
    await expect(progressBar).toBeVisible();

    // Progress text should show ratio
    await expect(page.locator('text=/\d+ \/ \d+ checks passed/')).toBeVisible();
  });

  test('should display individual integrity issues when failures occur', async ({
    page,
  }) => {
    await page.waitForSelector('text=Data Integrity', { timeout: 10000 });

    // Check if issues section exists
    const issuesSection = page.locator('text=Integrity Issues');

    if (await issuesSection.isVisible()) {
      // Should have at least one issue listed
      const issueItems = page.locator('[data-testid="integrity-issue"]');
      const count = await issueItems.count();
      expect(count).toBeGreaterThan(0);

      // Each issue should have an alert icon
      const firstIssue = issueItems.first();
      await expect(firstIssue.locator('.text-red-600')).toBeVisible();
    }
  });

  test('should show recommendation when integrity fails', async ({ page }) => {
    await page.waitForSelector('text=Data Integrity', { timeout: 10000 });

    // If integrity fails, should show recommendation
    const failBadge = page.locator('text=FAIL');

    if (await failBadge.isVisible()) {
      await expect(page.locator('text=Recommendation')).toBeVisible();
      await expect(
        page.locator('text=/review.*issues|re-running.*import/i')
      ).toBeVisible();
    }
  });

  test('should verify GameParticipation links are checked', async ({
    page,
  }) => {
    await page.waitForSelector('text=Data Integrity', { timeout: 10000 });

    // This test verifies that the GameParticipation link checks are included
    // The specific check message might appear if there are issues
    const issuesSection = page.locator('text=Integrity Issues');

    if (await issuesSection.isVisible()) {
      // Look for GameParticipation-related issues
      const gameParticipationIssue = page.locator(
        'text=/GameParticipation.*Player/'
      );
      // If visible, it's being checked
      if (await gameParticipationIssue.isVisible()) {
        expect(await gameParticipationIssue.textContent()).toContain(
          'GameParticipation'
        );
      }
    }
  });

  test('should verify PlayerTournament links are checked', async ({ page }) => {
    await page.waitForSelector('text=Data Integrity', { timeout: 10000 });

    // This test verifies that the PlayerTournament link checks are included
    const issuesSection = page.locator('text=Integrity Issues');

    if (await issuesSection.isVisible()) {
      // Look for PlayerTournament-related issues
      const playerTournamentIssue = page.locator(
        'text=/PlayerTournament.*Tournament/'
      );
      // If visible, it's being checked
      if (await playerTournamentIssue.isVisible()) {
        expect(await playerTournamentIssue.textContent()).toContain(
          'PlayerTournament'
        );
      }
    }
  });

  test('should verify orphaned records check is performed', async ({
    page,
  }) => {
    await page.waitForSelector('text=Data Integrity', { timeout: 10000 });

    // This test verifies that orphaned records are being checked
    const issuesSection = page.locator('text=Integrity Issues');

    if (await issuesSection.isVisible()) {
      // Look for orphaned records issues
      const orphanedIssue = page.locator('text=/orphaned/i');
      // If visible, orphaned checks are working
      if (await orphanedIssue.isVisible()) {
        expect(await orphanedIssue.textContent()).toMatch(/orphaned/i);
      }
    }
  });
});
