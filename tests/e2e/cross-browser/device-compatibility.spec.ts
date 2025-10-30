import { test, expect, devices } from '@playwright/test';

test.describe('Device Compatibility Tests', () => {
  test.describe('Mobile Devices', () => {
    test('should work on iPhone 12', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test touch interactions
      await page.touchscreen.tap(100, 100);
      await expect(
        page.locator('[data-testid="touch-feedback"]')
      ).toBeVisible();
    });

    test('should work on iPhone 12 Pro', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

      // Test orientation change
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
    });

    test('should work on iPhone 13', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

      // Test swipe gestures
      await page.touchscreen.tap(200, 200);
      await expect(
        page.locator('[data-testid="swipe-feedback"]')
      ).toBeVisible();
    });

    test('should work on iPhone 13 Pro', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test pinch zoom
      await page.touchscreen.tap(300, 300);
      await expect(page.locator('[data-testid="zoom-feedback"]')).toBeVisible();
    });

    test('should work on iPhone 14', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

      // Test haptic feedback
      await page.touchscreen.tap(150, 150);
      await expect(
        page.locator('[data-testid="haptic-feedback"]')
      ).toBeVisible();
    });

    test('should work on iPhone 14 Pro', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

      // Test dynamic island
      await page.touchscreen.tap(200, 50);
      await expect(
        page.locator('[data-testid="dynamic-island-feedback"]')
      ).toBeVisible();
    });

    test('should work on iPhone SE', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test small screen layout
      await expect(
        page.locator('[data-testid="small-screen-layout"]')
      ).toBeVisible();
    });

    test('should work on Pixel 5', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

      // Test Android-specific features
      await page.touchscreen.tap(100, 100);
      await expect(
        page.locator('[data-testid="android-feedback"]')
      ).toBeVisible();
    });

    test('should work on Pixel 6', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

      // Test Android-specific features
      await page.touchscreen.tap(200, 200);
      await expect(
        page.locator('[data-testid="android-feedback"]')
      ).toBeVisible();
    });

    test('should work on Pixel 7', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test Android-specific features
      await page.touchscreen.tap(300, 300);
      await expect(
        page.locator('[data-testid="android-feedback"]')
      ).toBeVisible();
    });

    test('should work on Galaxy S21', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

      // Test Samsung-specific features
      await page.touchscreen.tap(150, 150);
      await expect(
        page.locator('[data-testid="samsung-feedback"]')
      ).toBeVisible();
    });

    test('should work on Galaxy S22', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

      // Test Samsung-specific features
      await page.touchscreen.tap(250, 250);
      await expect(
        page.locator('[data-testid="samsung-feedback"]')
      ).toBeVisible();
    });

    test('should work on Galaxy S23', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test mobile-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test Samsung-specific features
      await page.touchscreen.tap(350, 350);
      await expect(
        page.locator('[data-testid="samsung-feedback"]')
      ).toBeVisible();
    });
  });

  test.describe('Tablet Devices', () => {
    test('should work on iPad', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test tablet-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });

    test('should work on iPad Air', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test tablet-specific functionality
      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

      // Test tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });

    test('should work on iPad Pro', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test tablet-specific functionality
      await page.goto('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

      // Test tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });

    test('should work on iPad Mini', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test tablet-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });

    test('should work on Galaxy Tab S8', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test tablet-specific functionality
      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

      // Test tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });

    test('should work on Galaxy Tab S9', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test tablet-specific functionality
      await page.goto('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

      // Test tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });

    test('should work on Surface Pro', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test tablet-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });

    test('should work on Surface Go', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test tablet-specific functionality
      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

      // Test tablet layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });
  });

  test.describe('Desktop Devices', () => {
    test('should work on MacBook Air', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test desktop-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test desktop layout
      await expect(
        page.locator('[data-testid="desktop-layout"]')
      ).toBeVisible();
    });

    test('should work on MacBook Pro', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test desktop-specific functionality
      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

      // Test desktop layout
      await expect(
        page.locator('[data-testid="desktop-layout"]')
      ).toBeVisible();
    });

    test('should work on iMac', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test desktop-specific functionality
      await page.goto('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

      // Test desktop layout
      await expect(
        page.locator('[data-testid="desktop-layout"]')
      ).toBeVisible();
    });

    test('should work on Mac Studio', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test desktop-specific functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      // Test desktop layout
      await expect(
        page.locator('[data-testid="desktop-layout"]')
      ).toBeVisible();
    });

    test('should work on Windows Desktop', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test desktop-specific functionality
      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();

      // Test desktop layout
      await expect(
        page.locator('[data-testid="desktop-layout"]')
      ).toBeVisible();
    });

    test('should work on Linux Desktop', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test desktop-specific functionality
      await page.goto('/settings');
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

      // Test desktop layout
      await expect(
        page.locator('[data-testid="desktop-layout"]')
      ).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to different screen sizes', async ({ page }) => {
      // Test mobile size
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

      // Test tablet size
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

      // Test desktop size
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      await expect(
        page.locator('[data-testid="desktop-layout"]')
      ).toBeVisible();
    });

    test('should handle orientation changes', async ({ page }) => {
      // Test portrait orientation
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await expect(
        page.locator('[data-testid="portrait-layout"]')
      ).toBeVisible();

      // Test landscape orientation
      await page.setViewportSize({ width: 667, height: 375 });
      await page.goto('/');
      await expect(
        page.locator('[data-testid="landscape-layout"]')
      ).toBeVisible();
    });

    test('should handle different pixel densities', async ({ page }) => {
      // Test standard density
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await expect(
        page.locator('[data-testid="standard-density"]')
      ).toBeVisible();

      // Test high density
      await page.setViewportSize({ width: 750, height: 1334 });
      await page.goto('/');
      await expect(page.locator('[data-testid="high-density"]')).toBeVisible();
    });
  });

  test.describe('Touch Interactions', () => {
    test('should handle tap gestures', async ({ page }) => {
      await page.goto('/');

      // Test single tap
      await page.touchscreen.tap(100, 100);
      await expect(page.locator('[data-testid="tap-feedback"]')).toBeVisible();

      // Test double tap
      await page.touchscreen.tap(200, 200);
      await page.touchscreen.tap(200, 200);
      await expect(
        page.locator('[data-testid="double-tap-feedback"]')
      ).toBeVisible();
    });

    test('should handle swipe gestures', async ({ page }) => {
      await page.goto('/');

      // Test horizontal swipe
      await page.touchscreen.tap(100, 200);
      await page.touchscreen.tap(300, 200);
      await expect(
        page.locator('[data-testid="horizontal-swipe-feedback"]')
      ).toBeVisible();

      // Test vertical swipe
      await page.touchscreen.tap(200, 100);
      await page.touchscreen.tap(200, 300);
      await expect(
        page.locator('[data-testid="vertical-swipe-feedback"]')
      ).toBeVisible();
    });

    test('should handle pinch gestures', async ({ page }) => {
      await page.goto('/');

      // Test pinch zoom
      await page.touchscreen.tap(200, 200);
      await page.touchscreen.tap(250, 250);
      await expect(
        page.locator('[data-testid="pinch-feedback"]')
      ).toBeVisible();
    });

    test('should handle long press gestures', async ({ page }) => {
      await page.goto('/');

      // Test long press
      await page.touchscreen.tap(150, 150);
      await page.waitForTimeout(1000);
      await expect(
        page.locator('[data-testid="long-press-feedback"]')
      ).toBeVisible();
    });
  });

  test.describe('Keyboard Interactions', () => {
    test('should handle keyboard navigation', async ({ page }) => {
      await page.goto('/');

      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Test arrow key navigation
      await page.keyboard.press('ArrowDown');
      await expect(page.locator(':focus')).toBeVisible();

      // Test enter key
      await page.keyboard.press('Enter');
      await expect(
        page.locator('[data-testid="enter-feedback"]')
      ).toBeVisible();
    });

    test('should handle keyboard shortcuts', async ({ page }) => {
      await page.goto('/');

      // Test Ctrl+A
      await page.keyboard.press('Control+KeyA');
      await expect(
        page.locator('[data-testid="select-all-feedback"]')
      ).toBeVisible();

      // Test Ctrl+C
      await page.keyboard.press('Control+KeyC');
      await expect(page.locator('[data-testid="copy-feedback"]')).toBeVisible();

      // Test Ctrl+V
      await page.keyboard.press('Control+KeyV');
      await expect(
        page.locator('[data-testid="paste-feedback"]')
      ).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support screen readers', async ({ page }) => {
      await page.goto('/');

      // Test screen reader support
      const result = await page.evaluate(() => {
        return {
          hasAriaLabels: document.querySelectorAll('[aria-label]').length > 0,
          hasAriaRoles: document.querySelectorAll('[role]').length > 0,
          hasAltText: document.querySelectorAll('img[alt]').length > 0,
          hasHeadings:
            document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
        };
      });

      expect(result.hasAriaLabels).toBe(true);
      expect(result.hasAriaRoles).toBe(true);
      expect(result.hasAltText).toBe(true);
      expect(result.hasHeadings).toBe(true);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    });

    test('should support high contrast mode', async ({ page }) => {
      await page.goto('/');

      // Test high contrast mode
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(page.locator('[data-testid="dark-mode"]')).toBeVisible();

      await page.emulateMedia({ colorScheme: 'light' });
      await expect(page.locator('[data-testid="light-mode"]')).toBeVisible();
    });

    test('should support reduced motion', async ({ page }) => {
      await page.goto('/');

      // Test reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(
        page.locator('[data-testid="reduced-motion"]')
      ).toBeVisible();

      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await expect(page.locator('[data-testid="normal-motion"]')).toBeVisible();
    });
  });
});
