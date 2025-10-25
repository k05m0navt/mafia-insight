import { test, expect } from '@playwright/test';

test.describe('Sync Status Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/gomafia-sync/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: {
            isRunning: false,
            progress: 100,
            currentOperation: null,
            lastSyncTime: '2024-01-01T00:00:00Z',
            lastSyncType: 'FULL',
            lastError: null,
          },
          metrics: {
            totalSyncs: 10,
            successfulSyncs: 8,
            failedSyncs: 2,
            averageDuration: 300000,
            errorRate: 20,
          },
          health: {
            status: 'HEALTHY',
            message: 'Sync system is operating normally',
            recommendations: [],
          },
        }),
      });
    });

    await page.route('**/api/gomafia-sync/sync/logs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: [
            {
              id: 'log-1',
              type: 'FULL',
              status: 'COMPLETED',
              startTime: '2024-01-01T00:00:00Z',
              endTime: '2024-01-01T01:00:00Z',
              recordsProcessed: 1000,
              errors: null,
            },
            {
              id: 'log-2',
              type: 'INCREMENTAL',
              status: 'FAILED',
              startTime: '2024-01-02T00:00:00Z',
              endTime: '2024-01-02T00:30:00Z',
              recordsProcessed: 50,
              errors: ['Network timeout'],
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
        }),
      });
    });
  });

  test('should display sync status page', async ({ page }) => {
    await page.goto('/sync-status');

    // Check page title
    await expect(page.locator('h1')).toContainText('Sync Status');

    // Check sync status indicator
    await expect(
      page.locator('[data-testid="sync-status-indicator"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="sync-status-indicator"]')
    ).toContainText('Healthy');

    // Check metrics
    await expect(page.locator('[data-testid="total-syncs"]')).toContainText(
      '10'
    );
    await expect(
      page.locator('[data-testid="successful-syncs"]')
    ).toContainText('8');
    await expect(page.locator('[data-testid="failed-syncs"]')).toContainText(
      '2'
    );
    await expect(page.locator('[data-testid="error-rate"]')).toContainText(
      '20%'
    );
  });

  test('should display sync trigger button', async ({ page }) => {
    await page.goto('/sync-status');

    // Check sync trigger button
    await expect(
      page.locator('[data-testid="sync-trigger-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="sync-trigger-button"]')
    ).toContainText('Trigger Sync');
  });

  test('should display sync logs table', async ({ page }) => {
    await page.goto('/sync-status');

    // Check sync logs table
    await expect(page.locator('[data-testid="sync-logs-table"]')).toBeVisible();

    // Check table headers
    await expect(page.locator('th')).toContainText([
      'Type',
      'Status',
      'Start Time',
      'End Time',
      'Records',
      'Actions',
    ]);

    // Check table rows
    await expect(page.locator('tbody tr')).toHaveCount(2);

    // Check first row (completed sync)
    await expect(
      page.locator('tbody tr').first().locator('td').nth(0)
    ).toContainText('FULL');
    await expect(
      page.locator('tbody tr').first().locator('td').nth(1)
    ).toContainText('COMPLETED');
    await expect(
      page.locator('tbody tr').first().locator('td').nth(4)
    ).toContainText('1000');

    // Check second row (failed sync)
    await expect(
      page.locator('tbody tr').last().locator('td').nth(0)
    ).toContainText('INCREMENTAL');
    await expect(
      page.locator('tbody tr').last().locator('td').nth(1)
    ).toContainText('FAILED');
    await expect(
      page.locator('tbody tr').last().locator('td').nth(4)
    ).toContainText('50');
  });

  test('should trigger sync when button is clicked', async ({ page }) => {
    // Mock sync trigger API
    await page.route('**/api/gomafia-sync/sync/trigger', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          type: 'FULL',
          recordsProcessed: 100,
          errors: [],
        }),
      });
    });

    await page.goto('/sync-status');

    // Click sync trigger button
    await page.locator('[data-testid="sync-trigger-button"]').click();

    // Check for success message
    await expect(
      page.locator('[data-testid="sync-success-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="sync-success-message"]')
    ).toContainText('Sync triggered successfully');
  });

  test('should handle sync trigger error', async ({ page }) => {
    // Mock sync trigger API error
    await page.route('**/api/gomafia-sync/sync/trigger', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed',
        }),
      });
    });

    await page.goto('/sync-status');

    // Click sync trigger button
    await page.locator('[data-testid="sync-trigger-button"]').click();

    // Check for error message
    await expect(
      page.locator('[data-testid="sync-error-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="sync-error-message"]')
    ).toContainText('Database connection failed');
  });

  test('should display running sync status', async ({ page }) => {
    // Mock running sync status
    await page.route('**/api/gomafia-sync/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: {
            isRunning: true,
            progress: 50,
            currentOperation: 'Processing players 1-100',
            lastSyncTime: '2024-01-01T00:00:00Z',
            lastSyncType: 'FULL',
            lastError: null,
          },
          metrics: {
            totalSyncs: 10,
            successfulSyncs: 8,
            failedSyncs: 2,
            averageDuration: 300000,
            errorRate: 20,
          },
          health: {
            status: 'HEALTHY',
            message: 'Sync system is operating normally',
            recommendations: [],
          },
        }),
      });
    });

    await page.goto('/sync-status');

    // Check running status
    await expect(
      page.locator('[data-testid="sync-status-indicator"]')
    ).toContainText('Running');
    await expect(page.locator('[data-testid="sync-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-progress"]')).toContainText(
      '50%'
    );
    await expect(
      page.locator('[data-testid="current-operation"]')
    ).toContainText('Processing players 1-100');
  });

  test('should display critical health status', async ({ page }) => {
    // Mock critical health status
    await page.route('**/api/gomafia-sync/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: {
            isRunning: false,
            progress: 0,
            currentOperation: null,
            lastSyncTime: '2024-01-01T00:00:00Z',
            lastSyncType: 'FULL',
            lastError: 'Network timeout',
          },
          metrics: {
            totalSyncs: 10,
            successfulSyncs: 3,
            failedSyncs: 7,
            averageDuration: 300000,
            errorRate: 70,
          },
          health: {
            status: 'CRITICAL',
            message: 'High error rate detected',
            recommendations: [
              'Investigate recent sync failures',
              'Check network connectivity to gomafia.pro',
            ],
          },
        }),
      });
    });

    await page.goto('/sync-status');

    // Check critical status
    await expect(
      page.locator('[data-testid="sync-status-indicator"]')
    ).toContainText('Critical');
    await expect(page.locator('[data-testid="health-message"]')).toContainText(
      'High error rate detected'
    );
    await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommendations"]')).toContainText(
      'Investigate recent sync failures'
    );
  });

  test('should filter sync logs by status', async ({ page }) => {
    await page.goto('/sync-status');

    // Click status filter
    await page.locator('[data-testid="status-filter"]').click();
    await page.locator('[data-testid="status-filter-option-FAILED"]').click();

    // Check that only failed logs are shown
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(
      page.locator('tbody tr').first().locator('td').nth(1)
    ).toContainText('FAILED');
  });

  test('should filter sync logs by type', async ({ page }) => {
    await page.goto('/sync-status');

    // Click type filter
    await page.locator('[data-testid="type-filter"]').click();
    await page.locator('[data-testid="type-filter-option-FULL"]').click();

    // Check that only FULL logs are shown
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(
      page.locator('tbody tr').first().locator('td').nth(0)
    ).toContainText('FULL');
  });

  test('should paginate sync logs', async ({ page }) => {
    // Mock paginated logs
    await page.route('**/api/gomafia-sync/sync/logs**', async (route) => {
      const url = new URL(route.request().url());
      const page = url.searchParams.get('page') || '1';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          logs: Array.from({ length: 20 }, (_, i) => ({
            id: `log-${i + 1}`,
            type: i % 2 === 0 ? 'FULL' : 'INCREMENTAL',
            status: i % 3 === 0 ? 'FAILED' : 'COMPLETED',
            startTime: new Date(
              Date.now() - i * 24 * 60 * 60 * 1000
            ).toISOString(),
            endTime: new Date(
              Date.now() - i * 24 * 60 * 60 * 1000 + 3600000
            ).toISOString(),
            recordsProcessed: 100 + i,
            errors: i % 3 === 0 ? ['Network timeout'] : null,
          })),
          pagination: {
            page: parseInt(page),
            limit: 20,
            total: 100,
            totalPages: 5,
          },
        }),
      });
    });

    await page.goto('/sync-status');

    // Check pagination controls
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    await expect(page.locator('[data-testid="pagination-info"]')).toContainText(
      'Page 1 of 5'
    );

    // Click next page
    await page.locator('[data-testid="next-page"]').click();

    // Check that page 2 is loaded
    await expect(page.locator('[data-testid="pagination-info"]')).toContainText(
      'Page 2 of 5'
    );
  });

  test('should view sync log details', async ({ page }) => {
    // Mock sync log details API
    await page.route('**/api/gomafia-sync/sync/logs/log-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'log-1',
          type: 'FULL',
          status: 'COMPLETED',
          startTime: '2024-01-01T00:00:00Z',
          endTime: '2024-01-01T01:00:00Z',
          recordsProcessed: 1000,
          errors: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T01:00:00Z',
        }),
      });
    });

    await page.goto('/sync-status');

    // Click view details button for first log
    await page
      .locator('tbody tr')
      .first()
      .locator('[data-testid="view-details"]')
      .click();

    // Check that details modal is opened
    await expect(
      page.locator('[data-testid="sync-log-details-modal"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="sync-log-details-modal"]')
    ).toContainText('Sync Log Details');
    await expect(
      page.locator('[data-testid="sync-log-details-modal"]')
    ).toContainText('FULL');
    await expect(
      page.locator('[data-testid="sync-log-details-modal"]')
    ).toContainText('COMPLETED');
    await expect(
      page.locator('[data-testid="sync-log-details-modal"]')
    ).toContainText('1000');
  });
});
