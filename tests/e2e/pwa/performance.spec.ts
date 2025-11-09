import { test, expect } from '@playwright/test';

test.describe('PWA Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test('should load within performance budget', async ({ page }) => {
    // Measure page load time
    const loadTime = await page.evaluate(() => {
      return (
        performance.timing.loadEventEnd - performance.timing.navigationStart
      );
    });

    expect(loadTime).toBeLessThan(3000); // 3 seconds

    // Check performance indicators
    await expect(
      page.locator('[data-testid="performance-indicator"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="performance-indicator"]')
    ).toContainText('Good');
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    // Check LCP (Largest Contentful Paint)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    expect(lcp).toBeLessThan(2500); // 2.5 seconds

    // Check FID (First Input Delay)
    const fid = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          resolve(firstEntry.processingStart - firstEntry.startTime);
        }).observe({ entryTypes: ['first-input'] });
      });
    });

    expect(fid).toBeLessThan(100); // 100ms

    // Check CLS (Cumulative Layout Shift)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
      });
    });

    expect(cls).toBeLessThan(0.1); // 0.1
  });

  test('should have efficient resource loading', async ({ page }) => {
    // Check resource loading performance
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((entry) => ({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
      }));
    });

    // Check that no resource takes too long to load
    resources.forEach((resource) => {
      expect(resource.duration).toBeLessThan(1000); // 1 second
    });

    // Check total resource size
    const totalSize = resources.reduce(
      (sum, resource) => sum + resource.size,
      0
    );
    expect(totalSize).toBeLessThan(1024 * 1024); // 1MB
  });

  test('should have efficient JavaScript execution', async ({ page }) => {
    // Check JavaScript execution time
    const jsExecutionTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('js-execution'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(jsExecutionTime).toBeLessThan(100); // 100ms

    // Check main thread blocking time
    const blockingTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('main-thread-blocking'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(blockingTime).toBeLessThan(50); // 50ms
  });

  test('should have efficient CSS rendering', async ({ page }) => {
    // Check CSS rendering performance
    const cssRenderingTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('css-rendering'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(cssRenderingTime).toBeLessThan(50); // 50ms

    // Check layout performance
    const layoutTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('layout'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(layoutTime).toBeLessThan(30); // 30ms
  });

  test('should have efficient image loading', async ({ page }) => {
    // Check image loading performance
    const imageLoadTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.match(/\.(jpg|jpeg|png|gif|webp)$/))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(imageLoadTime).toBeLessThan(500); // 500ms

    // Check image optimization
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        // Check if image is optimized (WebP format)
        expect(src).toMatch(/\.webp$/);
      }
    }
  });

  test('should have efficient font loading', async ({ page }) => {
    // Check font loading performance
    const fontLoadTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.match(/\.(woff2?|ttf|otf)$/))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(fontLoadTime).toBeLessThan(200); // 200ms

    // Check font display strategy
    const fontDisplay = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return style.fontDisplay;
    });

    expect(fontDisplay).toBe('swap');
  });

  test('should have efficient service worker performance', async ({ page }) => {
    // Check service worker registration time
    const swRegistrationTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('sw-registration'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(swRegistrationTime).toBeLessThan(100); // 100ms

    // Check service worker activation time
    const swActivationTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('sw-activation'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(swActivationTime).toBeLessThan(50); // 50ms
  });

  test('should have efficient caching performance', async ({ page }) => {
    // Check cache hit rate
    const cacheHitRate = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const cachedResources = resources.filter(
        (entry) => entry.transferSize === 0
      );
      return cachedResources.length / resources.length;
    });

    expect(cacheHitRate).toBeGreaterThan(0.8); // 80% cache hit rate

    // Check cache performance
    const cachePerformance = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('cache'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(cachePerformance).toBeLessThan(10); // 10ms
  });

  test('should have efficient network performance', async ({ page }) => {
    // Check network performance
    const networkTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(networkTime).toBeLessThan(2000); // 2 seconds

    // Check network efficiency
    const networkEfficiency = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce(
        (sum, entry) => sum + entry.transferSize,
        0
      );
      const totalTime = resources.reduce(
        (sum, entry) => sum + entry.duration,
        0
      );
      return totalSize / totalTime; // bytes per millisecond
    });

    expect(networkEfficiency).toBeGreaterThan(1000); // 1KB/ms
  });

  test('should have efficient memory usage', async ({ page }) => {
    // Check memory usage
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    expect(memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB

    // Check memory efficiency
    const memoryEfficiency = await page.evaluate(() => {
      const memory = (performance as any).memory;
      if (memory) {
        return memory.usedJSHeapSize / memory.totalJSHeapSize;
      }
      return 0;
    });

    expect(memoryEfficiency).toBeLessThan(0.8); // 80% memory usage
  });

  test('should have efficient DOM performance', async ({ page }) => {
    // Check DOM performance
    const domPerformance = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('dom'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(domPerformance).toBeLessThan(100); // 100ms

    // Check DOM size
    const domSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    expect(domSize).toBeLessThan(1000); // 1000 elements
  });

  test('should have efficient event handling', async ({ page }) => {
    // Check event handling performance
    const eventHandlingTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('event-handling'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(eventHandlingTime).toBeLessThan(50); // 50ms

    // Test event handling responsiveness
    const startTime = Date.now();
    await page.click('[data-testid="test-button"]');
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(responseTime).toBeLessThan(100); // 100ms
  });

  test('should have efficient animation performance', async ({ page }) => {
    // Check animation performance
    const animationTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('animation'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(animationTime).toBeLessThan(200); // 200ms

    // Check animation frame rate
    const frameRate = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        const startTime = performance.now();

        function countFrames() {
          frames++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frames);
          }
        }

        requestAnimationFrame(countFrames);
      });
    });

    expect(frameRate).toBeGreaterThan(30); // 30 FPS
  });

  test('should have efficient scroll performance', async ({ page }) => {
    // Check scroll performance
    const scrollTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('scroll'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(scrollTime).toBeLessThan(50); // 50ms

    // Test scroll responsiveness
    const startTime = Date.now();
    await page.evaluate(() => {
      window.scrollTo(0, 100);
    });
    const endTime = Date.now();
    const scrollResponseTime = endTime - startTime;

    expect(scrollResponseTime).toBeLessThan(100); // 100ms
  });

  test('should have efficient touch performance', async ({ page }) => {
    // Check touch performance
    const touchTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('touch'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(touchTime).toBeLessThan(50); // 50ms

    // Test touch responsiveness
    const startTime = Date.now();
    await page.touchscreen.tap(100, 100);
    const endTime = Date.now();
    const touchResponseTime = endTime - startTime;

    expect(touchResponseTime).toBeLessThan(100); // 100ms
  });

  test('should have efficient keyboard performance', async ({ page }) => {
    // Check keyboard performance
    const keyboardTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('keyboard'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(keyboardTime).toBeLessThan(50); // 50ms

    // Test keyboard responsiveness
    const startTime = Date.now();
    await page.keyboard.press('Tab');
    const endTime = Date.now();
    const keyboardResponseTime = endTime - startTime;

    expect(keyboardResponseTime).toBeLessThan(100); // 100ms
  });

  test('should have efficient accessibility performance', async ({ page }) => {
    // Check accessibility performance
    const accessibilityTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('accessibility'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(accessibilityTime).toBeLessThan(100); // 100ms

    // Test screen reader performance
    const screenReaderTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('screen-reader'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(screenReaderTime).toBeLessThan(50); // 50ms
  });

  test('should have efficient offline performance', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Check offline performance
    const offlineTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('offline'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(offlineTime).toBeLessThan(200); // 200ms

    // Test offline responsiveness
    const startTime = Date.now();
    await page.goto('/analytics');
    const endTime = Date.now();
    const offlineResponseTime = endTime - startTime;

    expect(offlineResponseTime).toBeLessThan(500); // 500ms
  });

  test('should have efficient sync performance', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Make some changes
    await page.goto('/admin/import');
    await page.click('[data-testid="start-import-button"]');

    // Go back online
    await page.context().setOffline(false);

    // Check sync performance
    const syncTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('sync'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(syncTime).toBeLessThan(1000); // 1 second

    // Test sync responsiveness
    const startTime = Date.now();
    await page.click('[data-testid="sync-button"]');
    const endTime = Date.now();
    const syncResponseTime = endTime - startTime;

    expect(syncResponseTime).toBeLessThan(200); // 200ms
  });

  test('should have efficient error handling performance', async ({ page }) => {
    // Check error handling performance
    const errorHandlingTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('error-handling'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(errorHandlingTime).toBeLessThan(100); // 100ms

    // Test error handling responsiveness
    const startTime = Date.now();
    await page.goto('/error-page');
    const endTime = Date.now();
    const errorResponseTime = endTime - startTime;

    expect(errorResponseTime).toBeLessThan(500); // 500ms
  });

  test('should have efficient data processing performance', async ({
    page,
  }) => {
    // Check data processing performance
    const dataProcessingTime = await page.evaluate(() => {
      return performance
        .getEntriesByType('measure')
        .filter((entry) => entry.name.includes('data-processing'))
        .reduce((sum, entry) => sum + entry.duration, 0);
    });

    expect(dataProcessingTime).toBeLessThan(200); // 200ms

    // Test data processing responsiveness
    const startTime = Date.now();
    await page.goto('/analytics');
    await page.click('[data-testid="process-data-button"]');
    const endTime = Date.now();
    const dataProcessingResponseTime = endTime - startTime;

    expect(dataProcessingResponseTime).toBeLessThan(1000); // 1 second
  });
});
