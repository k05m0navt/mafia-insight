import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Sync Preferences Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - you may need to adjust this based on your auth setup
    await page.goto('/settings/sync');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display sync preferences page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sync Settings');
    await expect(
      page.locator('text=Configure automatic synchronization')
    ).toBeVisible();
  });

  test('should toggle sync enabled/disabled', async ({ page }) => {
    // Find the switch
    const switchElement = page.locator('[id="sync-enabled"]');

    // Check initial state (should be unchecked by default)
    await expect(switchElement).not.toBeChecked();

    // Click to enable
    await switchElement.click();
    await expect(switchElement).toBeChecked();

    // Click to disable
    await switchElement.click();
    await expect(switchElement).not.toBeChecked();
  });

  test('should show schedule selector when sync is enabled', async ({
    page,
  }) => {
    // Enable sync
    const switchElement = page.locator('[id="sync-enabled"]');
    await switchElement.click();

    // Schedule selector should be visible
    const scheduleSelect = page.locator('[id="sync-schedule"]');
    await expect(scheduleSelect).toBeVisible();

    // Should have schedule options
    await scheduleSelect.click();
    await expect(page.locator('text=Daily (Midnight UTC)')).toBeVisible();
    await expect(page.locator('text=Hourly')).toBeVisible();
  });

  test('should save preferences successfully', async ({ page }) => {
    // Mock API response
    await page.route('**/api/settings/sync', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            syncEnabled: false,
            syncSchedule: null,
            lastSyncAt: null,
          }),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            syncEnabled: true,
            syncSchedule: 'daily',
            lastSyncAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Enable sync
    const switchElement = page.locator('[id="sync-enabled"]');
    await switchElement.click();

    // Select schedule
    const scheduleSelect = page.locator('[id="sync-schedule"]');
    await scheduleSelect.click();
    await page.locator('text=Daily (Midnight UTC)').click();

    // Click save
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();

    // Should show success message
    await expect(
      page.locator('text=Sync preferences saved successfully')
    ).toBeVisible();
  });

  test('should display last sync timestamp', async ({ page }) => {
    // Mock API response with lastSyncAt
    await page.route('**/api/settings/sync', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          syncEnabled: true,
          syncSchedule: 'daily',
          lastSyncAt: '2024-01-01T00:00:00Z',
        }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should display last sync time
    await expect(page.locator('text=Last Sync:')).toBeVisible();
  });

  test('should be accessible (WCAG 2.1 AA)', async ({ page }) => {
    await injectAxe(page);

    // Check accessibility
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[id="sync-enabled"]')).toBeVisible();

    // Enable sync to show schedule selector
    await page.locator('[id="sync-enabled"]').click();
    await expect(page.locator('[id="sync-schedule"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/settings/sync', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Failed to save sync preferences',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            syncEnabled: false,
            syncSchedule: null,
            lastSyncAt: null,
          }),
        });
      }
    });

    // Try to save
    const switchElement = page.locator('[id="sync-enabled"]');
    await switchElement.click();

    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();

    // Should show error message
    await expect(
      page.locator('text=Failed to save sync preferences')
    ).toBeVisible();
  });
});
