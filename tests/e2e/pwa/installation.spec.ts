import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('PWA Installation Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should display install prompt', async ({ page }) => {
    await testLogger.info('Testing install prompt display');

    await expect(
      page.locator('[data-testid="pwa-install-prompt"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="install-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="dismiss-button"]')).toBeVisible();
  });

  test('should install PWA successfully', async ({ page }) => {
    await testLogger.info('Testing PWA installation');

    // Click install button
    await page.locator('[data-testid="install-button"]').click();

    // Wait for installation confirmation
    await expect(page.locator('[data-testid="install-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="install-success"]')).toContainText(
      'Installed successfully'
    );

    // Check that install prompt is hidden
    await expect(
      page.locator('[data-testid="pwa-install-prompt"]')
    ).not.toBeVisible();
  });

  test('should dismiss install prompt', async ({ page }) => {
    await testLogger.info('Testing install prompt dismissal');

    // Click dismiss button
    await page.locator('[data-testid="dismiss-button"]').click();

    // Check that install prompt is hidden
    await expect(
      page.locator('[data-testid="pwa-install-prompt"]')
    ).not.toBeVisible();
  });

  test('should show install instruction when not installable', async ({
    page,
  }) => {
    await testLogger.info('Testing manual install instructions');

    // Simulate non-installable environment
    await page.evaluate(() => {
      // Remove beforeinstallprompt event listener
      window.addEventListener(
        'beforeinstallprompt',
        (e) => e.preventDefault(),
        { once: true }
      );
    });

    // Should show manual install instructions
    await expect(
      page.locator('[data-testid="manual-install-instructions"]')
    ).toBeVisible();
  });

  test('should check PWA manifest', async ({ page }) => {
    await testLogger.info('Testing PWA manifest');

    // Check manifest link
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });
    expect(manifest).toBeTruthy();

    // Check manifest content
    const manifestResponse = await page.request.get(manifest);
    expect(manifestResponse.status()).toBe(200);

    const manifestData = await manifestResponse.json();
    expect(manifestData).toHaveProperty('name');
    expect(manifestData).toHaveProperty('short_name');
    expect(manifestData).toHaveProperty('icons');
  });

  test('should verify PWA icons', async ({ page }) => {
    await testLogger.info('Testing PWA icons');

    // Check icon sizes
    const icons = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="icon"]'));
      return links.map((link) => ({
        sizes: link.getAttribute('sizes'),
        href: link.getAttribute('href'),
      }));
    });

    expect(icons.length).toBeGreaterThan(0);

    // Check for required icon sizes
    const sizes = ['192', '512'];
    for (const size of sizes) {
      expect(icons.some((icon) => icon.sizes?.includes(size))).toBe(true);
    }
  });

  test('should verify service worker registration', async ({ page }) => {
    await testLogger.info('Testing service worker registration');

    // Wait for service worker to register
    await page.waitForFunction(() => {
      return (
        'serviceWorker' in navigator &&
        navigator.serviceWorker.getRegistration()
      );
    });

    // Check service worker is registered
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration();
    });
    expect(swRegistration).toBeTruthy();
    expect(swRegistration?.scope).toBeTruthy();
  });

  test('should check PWA display mode', async ({ page }) => {
    await testLogger.info('Testing PWA display mode');

    const displayMode = await page.evaluate(() => {
      const meta = document.querySelector(
        'meta[name="mobile-web-app-capable"]'
      );
      return meta?.getAttribute('content');
    });

    // Should support standalone mode
    expect(displayMode).toBeTruthy();
  });

  test('should verify PWA theme color', async ({ page }) => {
    await testLogger.info('Testing PWA theme color');

    const themeColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      return meta?.getAttribute('content');
    });

    expect(themeColor).toBeTruthy();
  });

  test('should check PWA start URL', async ({ page }) => {
    await testLogger.info('Testing PWA start URL');

    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });

    const manifestResponse = await page.request.get(manifest);
    const manifestData = await manifestResponse.json();

    expect(manifestData).toHaveProperty('start_url');
    expect(manifestData.start_url).toBeTruthy();
  });

  test('should verify PWA scope', async ({ page }) => {
    await testLogger.info('Testing PWA scope');

    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });

    const manifestResponse = await page.request.get(manifest);
    const manifestData = await manifestResponse.json();

    expect(manifestData).toHaveProperty('scope');
    expect(manifestData.scope).toBeTruthy();
  });
});
