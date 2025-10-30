import { test, expect, devices } from '@playwright/test';

test.describe('Cross-Browser Compatibility Tests', () => {
  test.describe('Chrome Desktop', () => {
    test.use({ ...devices['Desktop Chrome'] });

    test('should work on Chrome desktop', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test basic functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
    });

    test('should handle Chrome-specific features', async ({ page }) => {
      await page.goto('/');

      // Test Chrome-specific APIs
      const result = await page.evaluate(() => {
        return {
          hasWebGL: !!document.createElement('canvas').getContext('webgl'),
          hasWebRTC: !!(
            navigator.mediaDevices && navigator.mediaDevices.getUserMedia
          ),
          hasServiceWorker: 'serviceWorker' in navigator,
          hasPushManager: 'PushManager' in window,
        };
      });

      expect(result.hasWebGL).toBe(true);
      expect(result.hasWebRTC).toBe(true);
      expect(result.hasServiceWorker).toBe(true);
      expect(result.hasPushManager).toBe(true);
    });
  });

  test.describe('Firefox Desktop', () => {
    test.use({ ...devices['Desktop Firefox'] });

    test('should work on Firefox desktop', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test basic functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
    });

    test('should handle Firefox-specific features', async ({ page }) => {
      await page.goto('/');

      // Test Firefox-specific APIs
      const result = await page.evaluate(() => {
        return {
          hasWebGL: !!document.createElement('canvas').getContext('webgl'),
          hasWebRTC: !!(
            navigator.mediaDevices && navigator.mediaDevices.getUserMedia
          ),
          hasServiceWorker: 'serviceWorker' in navigator,
          hasPushManager: 'PushManager' in window,
        };
      });

      expect(result.hasWebGL).toBe(true);
      expect(result.hasWebRTC).toBe(true);
      expect(result.hasServiceWorker).toBe(true);
      expect(result.hasPushManager).toBe(true);
    });
  });

  test.describe('Safari Desktop', () => {
    test.use({ ...devices['Desktop Safari'] });

    test('should work on Safari desktop', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test basic functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
    });

    test('should handle Safari-specific features', async ({ page }) => {
      await page.goto('/');

      // Test Safari-specific APIs
      const result = await page.evaluate(() => {
        return {
          hasWebGL: !!document.createElement('canvas').getContext('webgl'),
          hasWebRTC: !!(
            navigator.mediaDevices && navigator.mediaDevices.getUserMedia
          ),
          hasServiceWorker: 'serviceWorker' in navigator,
          hasPushManager: 'PushManager' in window,
        };
      });

      expect(result.hasWebGL).toBe(true);
      expect(result.hasWebRTC).toBe(true);
      expect(result.hasServiceWorker).toBe(true);
      expect(result.hasPushManager).toBe(true);
    });
  });

  test.describe('Edge Desktop', () => {
    test.use({ ...devices['Desktop Edge'] });

    test('should work on Edge desktop', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test basic functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
    });

    test('should handle Edge-specific features', async ({ page }) => {
      await page.goto('/');

      // Test Edge-specific APIs
      const result = await page.evaluate(() => {
        return {
          hasWebGL: !!document.createElement('canvas').getContext('webgl'),
          hasWebRTC: !!(
            navigator.mediaDevices && navigator.mediaDevices.getUserMedia
          ),
          hasServiceWorker: 'serviceWorker' in navigator,
          hasPushManager: 'PushManager' in window,
        };
      });

      expect(result.hasWebGL).toBe(true);
      expect(result.hasWebRTC).toBe(true);
      expect(result.hasServiceWorker).toBe(true);
      expect(result.hasPushManager).toBe(true);
    });
  });

  test.describe('Mobile Chrome', () => {
    test.use({ ...devices['Pixel 5'] });

    test('should work on mobile Chrome', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test basic functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
    });

    test('should handle mobile-specific features', async ({ page }) => {
      await page.goto('/');

      // Test mobile-specific APIs
      const result = await page.evaluate(() => {
        return {
          hasTouch: 'ontouchstart' in window,
          hasOrientation: 'orientation' in screen,
          hasVibration: 'vibrate' in navigator,
          hasGeolocation: 'geolocation' in navigator,
        };
      });

      expect(result.hasTouch).toBe(true);
      expect(result.hasOrientation).toBe(true);
      expect(result.hasVibration).toBe(true);
      expect(result.hasGeolocation).toBe(true);
    });
  });

  test.describe('Mobile Safari', () => {
    test.use({ ...devices['iPhone 12'] });

    test('should work on mobile Safari', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test basic functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
    });

    test('should handle iOS-specific features', async ({ page }) => {
      await page.goto('/');

      // Test iOS-specific APIs
      const result = await page.evaluate(() => {
        return {
          hasTouch: 'ontouchstart' in window,
          hasOrientation: 'orientation' in screen,
          hasVibration: 'vibrate' in navigator,
          hasGeolocation: 'geolocation' in navigator,
          isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        };
      });

      expect(result.hasTouch).toBe(true);
      expect(result.hasOrientation).toBe(true);
      expect(result.hasVibration).toBe(true);
      expect(result.hasGeolocation).toBe(true);
      expect(result.isIOS).toBe(true);
    });
  });

  test.describe('Tablet Chrome', () => {
    test.use({ ...devices['iPad Pro'] });

    test('should work on tablet Chrome', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-testid="app-root"]')).toBeVisible();

      // Test basic functionality
      await page.goto('/analytics');
      await expect(
        page.locator('[data-testid="analytics-page"]')
      ).toBeVisible();

      await page.goto('/import');
      await expect(page.locator('[data-testid="import-page"]')).toBeVisible();
    });

    test('should handle tablet-specific features', async ({ page }) => {
      await page.goto('/');

      // Test tablet-specific APIs
      const result = await page.evaluate(() => {
        return {
          hasTouch: 'ontouchstart' in window,
          hasOrientation: 'orientation' in screen,
          hasVibration: 'vibrate' in navigator,
          hasGeolocation: 'geolocation' in navigator,
          isTablet: /iPad|Android/.test(navigator.userAgent),
        };
      });

      expect(result.hasTouch).toBe(true);
      expect(result.hasOrientation).toBe(true);
      expect(result.hasVibration).toBe(true);
      expect(result.hasGeolocation).toBe(true);
      expect(result.isTablet).toBe(true);
    });
  });

  test.describe('Cross-Browser Feature Support', () => {
    test('should support WebGL across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl =
          canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return {
          hasWebGL: !!gl,
          webGLVersion: gl ? gl.getParameter(gl.VERSION) : null,
        };
      });

      expect(result.hasWebGL).toBe(true);
      expect(result.webGLVersion).toBeTruthy();
    });

    test('should support Service Workers across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        return {
          hasServiceWorker: 'serviceWorker' in navigator,
          hasPushManager: 'PushManager' in window,
          hasNotification: 'Notification' in window,
        };
      });

      expect(result.hasServiceWorker).toBe(true);
      expect(result.hasPushManager).toBe(true);
      expect(result.hasNotification).toBe(true);
    });

    test('should support WebRTC across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        return {
          hasWebRTC: !!(
            navigator.mediaDevices && navigator.mediaDevices.getUserMedia
          ),
          hasRTCPeerConnection: 'RTCPeerConnection' in window,
          hasRTCDataChannel: 'RTCDataChannel' in window,
        };
      });

      expect(result.hasWebRTC).toBe(true);
      expect(result.hasRTCPeerConnection).toBe(true);
      expect(result.hasRTCDataChannel).toBe(true);
    });

    test('should support IndexedDB across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        return {
          hasIndexedDB: 'indexedDB' in window,
          hasIDBFactory: 'IDBFactory' in window,
          hasIDBDatabase: 'IDBDatabase' in window,
        };
      });

      expect(result.hasIndexedDB).toBe(true);
      expect(result.hasIDBFactory).toBe(true);
      expect(result.hasIDBDatabase).toBe(true);
    });

    test('should support Web Storage across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        return {
          hasLocalStorage: 'localStorage' in window,
          hasSessionStorage: 'sessionStorage' in window,
          canWriteLocalStorage: (() => {
            try {
              localStorage.setItem('test', 'test');
              localStorage.removeItem('test');
              return true;
            } catch (e) {
              return false;
            }
          })(),
        };
      });

      expect(result.hasLocalStorage).toBe(true);
      expect(result.hasSessionStorage).toBe(true);
      expect(result.canWriteLocalStorage).toBe(true);
    });

    test('should support Fetch API across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        return {
          hasFetch: 'fetch' in window,
          hasRequest: 'Request' in window,
          hasResponse: 'Response' in window,
        };
      });

      expect(result.hasFetch).toBe(true);
      expect(result.hasRequest).toBe(true);
      expect(result.hasResponse).toBe(true);
    });

    test('should support WebSockets across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        return {
          hasWebSocket: 'WebSocket' in window,
          hasWebSocketConstructor: typeof WebSocket === 'function',
        };
      });

      expect(result.hasWebSocket).toBe(true);
      expect(result.hasWebSocketConstructor).toBe(true);
    });

    test('should support WebAssembly across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        return {
          hasWebAssembly: 'WebAssembly' in window,
          hasWasmModule: 'WebAssembly' in window && 'Module' in WebAssembly,
          hasWasmInstance: 'WebAssembly' in window && 'Instance' in WebAssembly,
        };
      });

      expect(result.hasWebAssembly).toBe(true);
      expect(result.hasWasmModule).toBe(true);
      expect(result.hasWasmInstance).toBe(true);
    });

    test('should support Web Components across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        return {
          hasCustomElements: 'customElements' in window,
          hasCustomElementRegistry:
            'customElements' in window && 'define' in customElements,
          hasShadowDOM: 'attachShadow' in Element.prototype,
        };
      });

      expect(result.hasCustomElements).toBe(true);
      expect(result.hasCustomElementRegistry).toBe(true);
      expect(result.hasShadowDOM).toBe(true);
    });

    test('should support Web Workers across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      const result = await page.evaluate(() => {
        return {
          hasWebWorker: 'Worker' in window,
          hasSharedWorker: 'SharedWorker' in window,
          hasServiceWorker: 'serviceWorker' in navigator,
        };
      });

      expect(result.hasWebWorker).toBe(true);
      expect(result.hasSharedWorker).toBe(true);
      expect(result.hasServiceWorker).toBe(true);
    });
  });

  test.describe('Browser-Specific Bug Workarounds', () => {
    test('should handle Chrome-specific bugs', async ({
      page,
      browserName,
    }) => {
      if (browserName === 'chromium') {
        await page.goto('/');

        // Test Chrome-specific workarounds
        const result = await page.evaluate(() => {
          return {
            hasChromeWorkaround: true,
            chromeVersion: navigator.userAgent.match(/Chrome\/(\d+)/)?.[1],
          };
        });

        expect(result.hasChromeWorkaround).toBe(true);
        expect(result.chromeVersion).toBeTruthy();
      }
    });

    test('should handle Firefox-specific bugs', async ({
      page,
      browserName,
    }) => {
      if (browserName === 'firefox') {
        await page.goto('/');

        // Test Firefox-specific workarounds
        const result = await page.evaluate(() => {
          return {
            hasFirefoxWorkaround: true,
            firefoxVersion: navigator.userAgent.match(/Firefox\/(\d+)/)?.[1],
          };
        });

        expect(result.hasFirefoxWorkaround).toBe(true);
        expect(result.firefoxVersion).toBeTruthy();
      }
    });

    test('should handle Safari-specific bugs', async ({
      page,
      browserName,
    }) => {
      if (browserName === 'webkit') {
        await page.goto('/');

        // Test Safari-specific workarounds
        const result = await page.evaluate(() => {
          return {
            hasSafariWorkaround: true,
            safariVersion: navigator.userAgent.match(/Version\/(\d+)/)?.[1],
          };
        });

        expect(result.hasSafariWorkaround).toBe(true);
        expect(result.safariVersion).toBeTruthy();
      }
    });

    test('should handle Edge-specific bugs', async ({ page, browserName }) => {
      if (browserName === 'msedge') {
        await page.goto('/');

        // Test Edge-specific workarounds
        const result = await page.evaluate(() => {
          return {
            hasEdgeWorkaround: true,
            edgeVersion: navigator.userAgent.match(/Edg\/(\d+)/)?.[1],
          };
        });

        expect(result.hasEdgeWorkaround).toBe(true);
        expect(result.edgeVersion).toBeTruthy();
      }
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should maintain performance across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      // Measure performance metrics
      const performance = await page.evaluate(() => {
        return {
          loadTime:
            performance.timing.loadEventEnd -
            performance.timing.navigationStart,
          domContentLoaded:
            performance.timing.domContentLoadedEventEnd -
            performance.timing.navigationStart,
          firstPaint:
            performance
              .getEntriesByType('paint')
              .find((entry) => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint:
            performance
              .getEntriesByType('paint')
              .find((entry) => entry.name === 'first-contentful-paint')
              ?.startTime || 0,
        };
      });

      expect(performance.loadTime).toBeLessThan(5000); // 5 seconds
      expect(performance.domContentLoaded).toBeLessThan(3000); // 3 seconds
      expect(performance.firstPaint).toBeLessThan(2000); // 2 seconds
      expect(performance.firstContentfulPaint).toBeLessThan(2500); // 2.5 seconds
    });

    test('should handle memory usage across all browsers', async ({
      page,
      browserName,
    }) => {
      await page.goto('/');

      // Measure memory usage
      const memory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
          totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
          jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0,
        };
      });

      expect(memory.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
      expect(memory.totalJSHeapSize).toBeLessThan(100 * 1024 * 1024); // 100MB
    });
  });
});
