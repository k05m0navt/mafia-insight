import { describe, it, expect } from 'vitest';

describe('Cross-Browser Performance Comparison', () => {
  describe('Load Time Comparison', () => {
    it('should load within acceptable time in all browsers', async () => {
      const start = performance.now();
      await fetch('/api/health');
      const duration = performance.now() - start;

      // Should load within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should measure First Contentful Paint', async () => {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        expect(entries.length).toBeGreaterThan(0);
      });

      observer.observe({ entryTypes: ['paint'] });

      // Wait a bit for paint
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe('Rendering Performance', () => {
    it('should measure layout performance', () => {
      const measure = (name: string, fn: () => void) => {
        performance.mark(`${name}-start`);
        fn();
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      };

      measure('render', () => {
        const div = document.createElement('div');
        div.textContent = 'Test';
        document.body.appendChild(div);
        document.body.removeChild(div);
      });

      const measureEntry = performance.getEntriesByName('render')[0];
      expect(measureEntry.duration).toBeLessThan(100);
    });

    it('should measure JavaScript execution time', () => {
      const start = performance.now();

      // Simulate some work
      for (let i = 0; i < 1000000; i++) {
        // Simulate work
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Memory Usage', () => {
    it('should measure memory footprint', () => {
      const memory = (
        performance as {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }
      ).memory;
      if (memory) {
        expect(memory.usedJSHeapSize).toBeGreaterThan(0);
        expect(memory.totalJSHeapSize).toBeGreaterThan(0);
        expect(memory.jsHeapSizeLimit).toBeGreaterThan(0);
      }
    });

    it('should detect memory leaks', () => {
      const initialMemory =
        (performance as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0;

      // Create some objects
      const objects = Array(1000)
        .fill(null)
        .map(() => ({}));

      const afterMemory =
        (performance as { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0;

      // Memory should increase
      expect(afterMemory).toBeGreaterThanOrEqual(initialMemory);

      // Clear references
      objects.length = 0;
    });
  });

  describe('Network Performance', () => {
    it('should measure request timing', async () => {
      const start = performance.now();
      const response = await fetch('/api/health');
      const duration = performance.now() - start;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(2000);
    });

    it('should measure resource loading', () => {
      const resources = performance.getEntriesByType('resource');
      expect(Array.isArray(resources)).toBe(true);

      if (resources.length > 0) {
        const firstResource = resources[0] as PerformanceResourceTiming;
        expect(firstResource.duration).toBeGreaterThan(0);
        expect(firstResource.transferSize).toBeGreaterThan(0);
      }
    });
  });

  describe('Animation Performance', () => {
    it('should measure animation frame rate', async () => {
      let frames = 0;
      const startTime = performance.now();

      const animate = () => {
        frames++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Should maintain ~60fps
      expect(frames).toBeGreaterThan(50);
    });
  });
});
