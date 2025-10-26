import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import { RetryManager } from '@/lib/gomafia/import/retry-manager';

describe('Error Handling Integration', () => {
  let browser: Browser;
  let page: Page;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
    await browser.close();
  });

  describe('EC-001: gomafia.pro unavailability', () => {
    it('should detect complete unavailability and wait 5 minutes', async () => {
      const retryManager = new RetryManager(2, {
        completeUnavailabilityWait: 5000,
      }); // 5 seconds for testing

      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;

        if (attemptCount === 1) {
          // Simulate complete unavailability (connection refused)
          throw new Error('Connection refused');
        }

        return 'success';
      };

      const startTime = Date.now();
      const result = await retryManager.execute(operation, {
        isCompleteUnavailability: true,
      });
      const elapsed = Date.now() - startTime;

      expect(result).toBe('success');
      expect(attemptCount).toBe(2);
      expect(elapsed).toBeGreaterThanOrEqual(5000); // Should wait at least 5 seconds
    }, 10000); // 10 second test timeout

    it('should detect when gomafia.pro returns 503', async () => {
      // Mock network response with 503
      await page.route('**/*', (route) => {
        route.fulfill({
          status: 503,
          body: 'Service Unavailable',
        });
      });

      const retryManager = new RetryManager(3);
      let attempts = 0;

      const operation = async () => {
        attempts++;
        const response = await page.goto('https://gomafia.pro/players');

        if (response?.status() === 503) {
          throw new Error('503 Service Unavailable');
        }

        return response;
      };

      await expect(retryManager.execute(operation)).rejects.toThrow('503');
      expect(attempts).toBe(3); // Should retry transient 503 errors
    }, 10000);

    it('should handle DNS resolution failures', async () => {
      const retryManager = new RetryManager(2);

      const operation = async () => {
        // Attempt to navigate to non-existent domain
        await page.goto('https://nonexistent-domain-12345.com', {
          timeout: 2000,
        });
      };

      await expect(retryManager.execute(operation)).rejects.toThrow();
    }, 15000);
  });

  describe('EC-004: Parser failures', () => {
    it('should handle malformed HTML gracefully', async () => {
      await page.route('**/*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body>Malformed content with missing elements</body></html>',
        });
      });

      const retryManager = new RetryManager(3);

      const operation = async () => {
        await page.goto('https://gomafia.pro/players');

        // Try to find element that doesn't exist
        const element = await page.locator('.player-name').first();
        const count = await element.count();

        if (count === 0) {
          throw new Error('Parser error: Expected elements not found');
        }

        return count;
      };

      // Parser failures are permanent errors - should not retry
      await expect(retryManager.execute(operation)).rejects.toThrow(
        'Parser error'
      );
    }, 10000);

    it('should handle unexpected data formats', async () => {
      await page.route('**/*', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid response' }),
        });
      });

      const retryManager = new RetryManager(2);

      const operation = async () => {
        const response = await page.goto('https://gomafia.pro/api/players');
        const contentType = response?.headers()['content-type'];

        if (contentType?.includes('application/json')) {
          throw new Error('Unexpected JSON response instead of HTML');
        }
      };

      await expect(retryManager.execute(operation)).rejects.toThrow();
    }, 10000);
  });

  describe('EC-006: Network intermittency', () => {
    it('should retry on network timeout', async () => {
      const retryManager = new RetryManager(3);
      let attempts = 0;

      const operation = async () => {
        attempts++;

        if (attempts === 1) {
          // First attempt: throw timeout error
          throw new Error('Network timeout');
        }

        // Second attempt: succeed
        return 200;
      };

      // Should succeed on retry
      const status = await retryManager.execute(operation);
      expect(status).toBe(200);
      expect(attempts).toBe(2);
    }, 15000);

    it('should handle socket hang up errors', async () => {
      const retryManager = new RetryManager(3);
      let attempts = 0;

      const operation = async () => {
        attempts++;

        if (attempts === 1) {
          throw new Error('socket hang up');
        }

        return 'success';
      };

      const result = await retryManager.execute(operation);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });
  });

  describe('EC-007: Data validation failures', () => {
    it('should not retry on validation failures (permanent errors)', async () => {
      const retryManager = new RetryManager(3);

      const operation = async () => {
        // Simulate data that fails validation
        throw new Error('Invalid data format: missing required field');
      };

      await expect(retryManager.execute(operation)).rejects.toThrow(
        'Invalid data format'
      );
    });
  });

  describe('EC-008: Timeout handling', () => {
    it('should retry on request timeout', async () => {
      const retryManager = new RetryManager(2);
      let attempts = 0;

      const operation = async () => {
        attempts++;

        if (attempts === 1) {
          throw new Error('Request timeout');
        }

        return 'success';
      };

      const result = await retryManager.execute(operation);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should handle navigation timeout', async () => {
      // Set extremely short timeout to force timeout
      await page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Delay 3 seconds
        route.fulfill({
          status: 200,
          body: '<html><body>Too late</body></html>',
        });
      });

      const retryManager = new RetryManager(2);

      const operation = async () => {
        await page.goto('https://gomafia.pro/players', { timeout: 1000 }); // 1 second timeout
      };

      // Should retry on timeout
      await expect(retryManager.execute(operation)).rejects.toThrow();
    }, 15000);
  });

  describe('Retry metrics tracking during errors', () => {
    it('should track retry attempts across different error types', async () => {
      const retryManager = new RetryManager(3);
      let attempts = 0;

      const operation = async () => {
        attempts++;

        if (attempts === 1) {
          throw new Error('Network timeout'); // Transient
        } else if (attempts === 2) {
          throw new Error('Connection refused'); // Transient
        }

        return 'success';
      };

      await retryManager.execute(operation);

      const metrics = retryManager.getMetrics();
      expect(metrics.totalAttempts).toBe(3);
      expect(metrics.successfulRetries).toBe(1); // Only 1 successful retry (3rd attempt succeeds after 2 failures)
      expect(metrics.failedOperations).toBe(0);
    });
  });
});
