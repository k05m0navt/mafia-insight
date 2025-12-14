import { test, expect } from '@playwright/test';

test.describe('Import Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sync page
    await page.goto('/sync');
    await expect(
      page.getByRole('heading', { name: /Data Synchronization/i })
    ).toBeVisible();
  });

  test('should display progress card when import is running', async ({
    page,
  }) => {
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

    // Wait for progress card to appear
    await expect(page.getByText('Import Progress')).toBeVisible();

    // Check progress bar is visible
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // Check progress percentage is displayed
    await expect(page.getByText(/50%/)).toBeVisible();

    // Check processed/total counts are displayed
    await expect(page.getByText(/500.*1,000/)).toBeVisible();

    // Check current phase is displayed
    await expect(page.getByText(/Games/i)).toBeVisible();

    // Check elapsed time is displayed
    await expect(page.getByText(/Elapsed Time/i)).toBeVisible();

    // Check estimated time remaining is displayed
    await expect(page.getByText(/Estimated Remaining/i)).toBeVisible();

    // Check processing rate is displayed
    await expect(page.getByText(/Processing Rate/i)).toBeVisible();
  });

  test('should update progress in real-time', async ({ page }) => {
    let progressValue = 25;

    // Mock progress API with changing values
    await page.route('**/api/gomafia-sync/import/progress', async (route) => {
      progressValue += 25; // Simulate progress increase
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentPhase: 'GAMES',
          progress: Math.min(progressValue, 100),
          currentEntity: {
            id: `game-${progressValue}`,
            name: `Game ${progressValue}`,
          },
          processedCount: progressValue * 10,
          totalCount: 1000,
          elapsedSeconds: 300 + progressValue,
          estimatedSecondsRemaining: Math.max(300 - progressValue, 0),
          processingRate: 1.67,
          isRunning: progressValue < 100,
          startTime: new Date(Date.now() - 300000).toISOString(),
          lastUpdated: new Date().toISOString(),
        }),
      });
    });

    // Mock sync status
    await page.route('**/api/gomafia-sync/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isRunning: true,
          progress: progressValue,
          currentOperation: 'Importing games',
        }),
      });
    });

    // Wait for initial progress
    await expect(page.getByText('Import Progress')).toBeVisible();

    // Wait for progress to update (polling happens every 2 seconds)
    await page.waitForTimeout(2500);

    // Verify progress has updated
    await expect(page.getByText(/50%/)).toBeVisible();
  });

  test('should persist progress across page refreshes', async ({ page }) => {
    const progressData = {
      currentPhase: 'GAMES',
      progress: 75,
      currentEntity: { id: 'game-750', name: 'Game 750' },
      processedCount: 750,
      totalCount: 1000,
      elapsedSeconds: 450,
      estimatedSecondsRemaining: 150,
      processingRate: 1.67,
      isRunning: true,
      startTime: new Date(Date.now() - 450000).toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    // Mock progress API
    await page.route('**/api/gomafia-sync/import/progress', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(progressData),
      });
    });

    // Mock sync status
    await page.route('**/api/gomafia-sync/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isRunning: true,
          progress: 75,
          currentOperation: 'Importing games',
        }),
      });
    });

    // Wait for progress to load
    await expect(page.getByText('Import Progress')).toBeVisible();
    await expect(page.getByText(/75%/)).toBeVisible();
    await expect(page.getByText(/750.*1,000/)).toBeVisible();

    // Refresh page
    await page.reload();
    await expect(
      page.getByRole('heading', { name: /Data Synchronization/i })
    ).toBeVisible();

    // Verify progress persists after refresh
    await expect(page.getByText('Import Progress')).toBeVisible();
    await expect(page.getByText(/75%/)).toBeVisible();
    await expect(page.getByText(/750.*1,000/)).toBeVisible();
  });

  test('should show phase transitions', async ({ page }) => {
    const phases = ['CLUBS', 'PLAYERS', 'GAMES', 'STATISTICS'];
    let phaseIndex = 0;

    // Mock progress API with phase transitions
    await page.route('**/api/gomafia-sync/import/progress', async (route) => {
      const currentPhase = phases[phaseIndex];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentPhase,
          progress: (phaseIndex + 1) * 25,
          currentEntity: { id: `${currentPhase.toLowerCase()}-${phaseIndex}` },
          processedCount: (phaseIndex + 1) * 250,
          totalCount: 1000,
          elapsedSeconds: 300 + phaseIndex * 60,
          estimatedSecondsRemaining: 300 - phaseIndex * 60,
          processingRate: 1.67,
          isRunning: phaseIndex < phases.length - 1,
          startTime: new Date(Date.now() - 300000).toISOString(),
          lastUpdated: new Date().toISOString(),
        }),
      });
      phaseIndex = Math.min(phaseIndex + 1, phases.length - 1);
    });

    // Mock sync status
    await page.route('**/api/gomafia-sync/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isRunning: true,
          progress: phaseIndex * 25,
          currentOperation: `Importing ${phases[phaseIndex]}`,
        }),
      });
    });

    // Wait for initial progress
    await expect(page.getByText('Import Progress')).toBeVisible();

    // Wait for phase transitions
    await page.waitForTimeout(3000);

    // Verify phase is displayed
    await expect(
      page.getByText(/Clubs|Players|Games|Statistics/i)
    ).toBeVisible();
  });

  test('should handle missing progress data gracefully', async ({ page }) => {
    // Mock progress API to return no running import
    await page.route('**/api/gomafia-sync/import/progress', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentPhase: null,
          progress: 0,
          currentEntity: null,
          processedCount: 0,
          totalCount: 0,
          elapsedSeconds: 0,
          estimatedSecondsRemaining: 0,
          processingRate: 0,
          isRunning: false,
          startTime: null,
          lastUpdated: null,
        }),
      });
    });

    // Mock sync status to show not running
    await page.route('**/api/gomafia-sync/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isRunning: false,
          progress: 0,
          currentOperation: null,
        }),
      });
    });

    // Progress card should not be visible when not running
    await expect(page.getByText('Import Progress')).not.toBeVisible();
  });

  test('should display current entity being processed', async ({ page }) => {
    // Mock progress API with entity information
    await page.route('**/api/gomafia-sync/import/progress', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          currentPhase: 'GAMES',
          progress: 50,
          currentEntity: { id: 'game-500', name: 'Game 500' },
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

    // Mock sync status
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

    // Wait for progress card
    await expect(page.getByText('Import Progress')).toBeVisible();

    // Verify current entity is displayed
    await expect(page.getByText(/Game 500/i)).toBeVisible();
  });
});
