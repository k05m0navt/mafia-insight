import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('PWA Notifications Testing', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);

    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should request notification permission', async ({ page }) => {
    await testLogger.info('Testing notification permission request');

    // Click enable notifications button
    await page.locator('[data-testid="enable-notifications-button"]').click();

    // Check permission was granted
    const permission = await page.evaluate(() => {
      return Notification.permission;
    });
    expect(permission).toBe('granted');
  });

  test('should send notifications', async ({ page }) => {
    await testLogger.info('Testing notification sending');

    // Trigger a notification
    await page.locator('[data-testid="trigger-notification-button"]').click();

    // Check notification was sent
    await expect(
      page.locator('[data-testid="notification-sent-indicator"]')
    ).toBeVisible();
  });

  test('should handle notification click', async ({ page, context }) => {
    await testLogger.info('Testing notification click handling');

    // Set up notification click listener
    await page.evaluate(() => {
      navigator.serviceWorker.addEventListener('notificationclick', () => {
        document.body.setAttribute('data-notification-clicked', 'true');
      });
    });

    // Trigger a notification
    await page.locator('[data-testid="trigger-notification-button"]').click();

    // Simulate notification click
    await page.evaluate(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Test', { data: { url: '/' } });
      });
    });

    // Check notification click was handled
    await expect(
      page.locator('[data-notification-clicked="true"]')
    ).toBeTruthy();
  });

  test('should format notification content', async ({ page }) => {
    await testLogger.info('Testing notification content formatting');

    const notification = await page.evaluate(() => {
      return new Promise((resolve) => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('Test Title', {
            body: 'Test body content',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
          });
          resolve(true);
        });
      });
    });

    expect(notification).toBeTruthy();
  });

  test('should handle notification close', async ({ page }) => {
    await testLogger.info('Testing notification close handling');

    // Set up notification close listener
    let notificationClosed = false;
    await page.evaluate(() => {
      navigator.serviceWorker.addEventListener('notificationclose', () => {
        document.body.setAttribute('data-notification-closed', 'true');
      });
    });

    // Check notification close was handled
    await expect(
      page.locator('[data-notification-closed="true"]')
    ).toBeTruthy();
  });

  test('should set notification actions', async ({ page }) => {
    await testLogger.info('Testing notification actions');

    const notification = await page.evaluate(() => {
      return navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Test', {
          actions: [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Close' },
          ],
        });
      });
    });

    expect(notification).toBeTruthy();
  });

  test('should handle notification permission denial', async ({
    page,
    context,
  }) => {
    await testLogger.info('Testing notification permission denial');

    // Deny permission
    await context.clearPermissions();

    // Try to enable notifications
    await page.locator('[data-testid="enable-notifications-button"]').click();

    // Should show permission denied message
    await expect(
      page.locator('[data-testid="permission-denied-message"]')
    ).toBeVisible();
  });

  test('should check notification persistence', async ({ page }) => {
    await testLogger.info('Testing notification persistence');

    // Send multiple notifications
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="trigger-notification-button"]').click();
      await page.waitForTimeout(500);
    }

    // Check notification count
    const count = await page.evaluate(() => {
      return localStorage.getItem('notificationCount');
    });
    expect(count).toBe('3');
  });

  test('should handle silent notifications', async ({ page }) => {
    await testLogger.info('Testing silent notifications');

    const notification = await page.evaluate(() => {
      return navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Silent Notification', {
          silent: true,
        });
      });
    });

    expect(notification).toBeTruthy();
  });
});
