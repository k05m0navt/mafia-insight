import { test, expect } from '@playwright/test';

/**
 * E2E Performance Test for Authentication (Phase 7 - T051)
 *
 * Verifies performance requirement SC-004:
 * Authentication state updates reflected in navbar within 1 second
 */

test.describe('Authentication Performance (SC-004)', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' as const,
  };

  const mockAuthToken = 'mock-auth-token-12345';

  /**
   * Helper to set up authenticated session
   */
  async function setupAuthenticatedSession(page: any) {
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: mockAuthToken,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
      {
        name: 'user-role',
        value: 'admin',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
  }

  /**
   * Helper to mock authenticated API
   */
  async function setupAuthenticatedAPI(page: any) {
    await page.route('**/api/auth/me**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });
  }

  test('T051: Auth state updates reflected in navbar within 1 second', async ({
    page,
  }) => {
    await setupAuthenticatedAPI(page);

    // Navigate to home page (unauthenticated initially)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Record start time before login simulation
    const startTime = Date.now();

    // Simulate login by setting auth cookies
    await setupAuthenticatedSession(page);

    // Trigger auth state check (simulating login completion)
    await page.evaluate(() => {
      // Dispatch a custom event or directly update localStorage
      // to simulate Zustand store update
      if (window.dispatchEvent) {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'auth-store',
            newValue: JSON.stringify({
              state: {
                isAuthenticated: true,
                user: {
                  id: 'test-user-123',
                  email: 'test@example.com',
                  name: 'Test User',
                  role: 'admin',
                },
              },
            }),
            storageArea: window.localStorage,
          })
        );
      }
    });

    // Wait for navbar to update (user icon appears or login buttons disappear)
    await Promise.race([
      page.waitForSelector('[data-testid*="user"], img[alt*="user"]', {
        timeout: 1000,
      }),
      page.waitForFunction(
        () => {
          const loginButtons = Array.from(
            document.querySelectorAll('button')
          ).filter((btn) => /login|sign in/i.test(btn.textContent || ''));
          return loginButtons.length === 0;
        },
        { timeout: 1000 }
      ),
    ]).catch(() => {
      // If neither condition is met, check if we're on a different page
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify update happened within 1 second (SC-004 requirement)
    expect(duration).toBeLessThan(1000);

    // Also verify the state actually changed
    const hasUserIcon =
      (await page.locator('[data-testid*="user"], img[alt*="user"]').count()) >
      0;
    const hasNoLoginButtons =
      (await page.getByRole('button', { name: /login|sign in/i }).count()) ===
      0;

    expect(hasUserIcon || hasNoLoginButtons).toBe(true);
  });

  test('T051: Logout state updates reflected in navbar within 1 second', async ({
    page,
  }) => {
    // Start authenticated
    await setupAuthenticatedSession(page);
    await setupAuthenticatedAPI(page);

    await page.goto('/players');
    await page.waitForLoadState('networkidle');

    // Record start time before logout
    const startTime = Date.now();

    // Clear cookies and localStorage (simulate logout)
    await page.evaluate(() => {
      localStorage.removeItem('auth-store');

      // Dispatch storage event
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'auth-store',
          oldValue: JSON.stringify({
            state: { isAuthenticated: true, user: {} },
          }),
          newValue: null,
          storageArea: window.localStorage,
        })
      );
    });

    await page.context().clearCookies();

    // Wait for navbar to update (login buttons appear or user icon disappears)
    await Promise.race([
      page.waitForSelector(
        'button:has-text("Login"), button:has-text("Sign In")',
        {
          timeout: 1000,
        }
      ),
      page.waitForFunction(
        () => {
          const userIcons = document.querySelectorAll(
            '[data-testid*="user"], img[alt*="user"]'
          );
          return userIcons.length === 0;
        },
        { timeout: 1000 }
      ),
    ]).catch(() => {
      // Check if redirected to login page
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify update happened within 1 second
    expect(duration).toBeLessThan(1000);

    // Verify state changed (either login buttons visible or redirected to login)
    const isLoginPage = page.url().includes('/login');
    const showsLoginButtons =
      (await page.getByRole('button', { name: /login|sign in/i }).count()) > 0;

    expect(isLoginPage || showsLoginButtons).toBe(true);
  });
});
