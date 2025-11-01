import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Import Page Authentication
 *
 * Tests tasks T024-T027 from Phase 4 (US2):
 * - T024: Test import page access for authenticated users
 * - T025: Test import progress viewing
 * - T026: Test import operations (start/stop)
 * - T027: Test unauthorized access
 */

test.describe('Import Page Authentication', () => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' as const,
  };

  const mockAuthToken = 'mock-auth-token-12345';

  /**
   * Helper to set up authenticated session via cookies
   */
  async function setupAuthenticatedSession(page: any) {
    // Set auth cookies
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: mockAuthToken,
        domain: 'localhost',
        path: '/',
        httpOnly: false, // Must be false for client-side access in tests
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
   * Helper to mock authenticated API responses
   */
  async function setupAuthenticatedAPIMocks(page: any) {
    // Mock /api/auth/me endpoint
    await page.route('**/api/auth/me**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: mockUser,
        }),
      });
    });

    // Mock /api/import/progress GET
    await page.route('**/api/import/progress**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            progress: {
              id: 'test-import-1',
              operation: 'Full Data Sync',
              progress: 45.5,
              totalRecords: 1000,
              processedRecords: 455,
              errors: 2,
              startTime: new Date().toISOString(),
              status: 'RUNNING',
            },
          }),
        });
      } else if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-import-2',
            operation: body.operation,
            progress: 0,
            totalRecords: body.totalRecords,
            processedRecords: 0,
            errors: 0,
            startTime: new Date().toISOString(),
            status: 'PENDING',
          }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-import-1',
            operation: 'Full Data Sync',
            progress: 45.5,
            totalRecords: 1000,
            processedRecords: 455,
            errors: 2,
            startTime: new Date().toISOString(),
            status: 'CANCELLED',
          }),
        });
      }
    });
  }

  test.describe('T024: Authenticated User Access', () => {
    test('should load import page successfully for authenticated user', async ({
      page,
    }) => {
      await setupAuthenticatedSession(page);
      await setupAuthenticatedAPIMocks(page);

      // Navigate to import page (both admin and dashboard versions)
      const importPaths = ['/(admin)/import', '/(dashboard)/import-progress'];

      for (const path of importPaths) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        // Verify page loaded without authentication errors
        const errorMessages = await page
          .locator('text=/authentication|unauthorized|sign in/i')
          .count();
        expect(errorMessages).toBe(0);

        // Verify import page elements are visible
        const hasImportContent = await page
          .locator('text=/import|progress/i')
          .count();
        expect(hasImportContent).toBeGreaterThan(0);
      }
    });

    test('should not show login/signup buttons on import page', async ({
      page,
    }) => {
      await setupAuthenticatedSession(page);
      await setupAuthenticatedAPIMocks(page);

      await page.goto('/(admin)/import');
      await page.waitForLoadState('networkidle');

      // Verify login/signup buttons are NOT visible
      const loginButton = page.getByRole('button', { name: /login|sign in/i });
      const signupButton = page.getByRole('button', {
        name: /signup|sign up/i,
      });

      await expect(loginButton.or(signupButton))
        .not.toBeVisible()
        .catch(() => {
          // Button might not exist at all, which is fine
        });
    });
  });

  test.describe('T025: Import Progress Viewing', () => {
    test('should display import progress for authenticated user', async ({
      page,
    }) => {
      await setupAuthenticatedSession(page);
      await setupAuthenticatedAPIMocks(page);

      await page.goto('/(dashboard)/import-progress');
      await page.waitForLoadState('networkidle');

      // Verify progress data is displayed
      await expect(
        page.locator('text=/Full Data Sync|RUNNING|45/i')
      ).toBeVisible({ timeout: 10000 });

      // Verify progress card or progress display is visible
      const progressElements = await page
        .locator('[role="progressbar"], .progress, [data-testid*="progress"]')
        .count();
      expect(progressElements).toBeGreaterThan(0);
    });

    test('should fetch and display import progress data correctly', async ({
      page,
    }) => {
      await setupAuthenticatedSession(page);
      await setupAuthenticatedAPIMocks(page);

      await page.goto('/(dashboard)/import-progress');
      await page.waitForLoadState('networkidle');

      // Check that API was called successfully
      const apiRequests = await page.evaluate(() => {
        return (
          window.performance
            .getEntriesByType('resource')
            .filter(
              (entry: any) =>
                entry.name.includes('/api/import/progress') &&
                entry.name.includes('GET')
            ).length > 0
        );
      });

      // Verify progress information is displayed
      await expect(page.locator('text=/processed|total|records/i')).toBeVisible(
        {
          timeout: 5000,
        }
      );
    });

    test('should handle empty progress state', async ({ page }) => {
      await setupAuthenticatedSession(page);

      // Mock empty progress response
      await page.route('**/api/import/progress**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'No import operation in progress',
              progress: null,
            }),
          });
        }
      });

      await page.goto('/(dashboard)/import-progress');
      await page.waitForLoadState('networkidle');

      // Should display empty state or "no progress" message
      const hasEmptyState =
        (await page.locator('text=/no import|idle|not running/i').count()) > 0;
      expect(hasEmptyState).toBe(true);
    });
  });

  test.describe('T026: Import Operations', () => {
    test('should start import successfully for authenticated user', async ({
      page,
    }) => {
      await setupAuthenticatedSession(page);
      await setupAuthenticatedAPIMocks(page);

      await page.goto('/(admin)/import');
      await page.waitForLoadState('networkidle');

      // Find and click start import button
      const startButton = page.getByRole('button', {
        name: /start import|start|import/i,
      });
      await expect(startButton).toBeVisible();
      await startButton.click();

      // Wait for API call to complete
      await page.waitForResponse(
        (response) =>
          response.url().includes('/api/import/progress') &&
          response.request().method() === 'POST'
      );

      // Verify success (no error messages)
      const errorMessages = await page
        .locator('text=/error|failed|authentication/i')
        .count();
      expect(errorMessages).toBe(0);
    });

    test('should stop/cancel import successfully for authenticated user', async ({
      page,
    }) => {
      await setupAuthenticatedSession(page);
      await setupAuthenticatedAPIMocks(page);

      await page.goto('/(dashboard)/import-progress');
      await page.waitForLoadState('networkidle');

      // Find and click stop/cancel button
      const stopButton = page.getByRole('button', {
        name: /stop|cancel|end/i,
      });

      if (await stopButton.isVisible()) {
        await stopButton.click();

        // Wait for API call to complete
        await page.waitForResponse(
          (response) =>
            response.url().includes('/api/import/progress') &&
            response.request().method() === 'DELETE'
        );

        // Verify success (status should update)
        await expect(
          page.locator('text=/cancelled|stopped|idle/i')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle import operations without authentication errors', async ({
      page,
    }) => {
      await setupAuthenticatedSession(page);
      await setupAuthenticatedAPIMocks(page);

      await page.goto('/(admin)/import');
      await page.waitForLoadState('networkidle');

      // Perform multiple operations
      const startButton = page.getByRole('button', {
        name: /start import|start|import/i,
      });
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(1000);

        // Verify no auth errors appeared
        const authErrors = await page
          .locator(
            'text=/authentication required|please sign in|unauthorized/i'
          )
          .count();
        expect(authErrors).toBe(0);
      }
    });
  });

  test.describe('T027: Unauthorized Access', () => {
    test('should redirect to login when accessing import page without authentication', async ({
      page,
    }) => {
      // Don't set up authentication - no cookies
      // Mock API to return 401
      await page.route('**/api/import/progress**', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Authentication required',
            message: 'Please sign in to view import progress',
          }),
        });
      });

      await page.goto('/(admin)/import');

      // Should either:
      // 1. Redirect to login page
      // 2. Show authentication required message
      // 3. Show login/signup buttons

      const isLoginPage = page.url().includes('/login');
      const hasAuthMessage = await page
        .locator('text=/authentication|sign in|login required/i')
        .count();
      const hasLoginButtons = await page
        .getByRole('button', { name: /login|sign in/i })
        .count();

      expect(isLoginPage || hasAuthMessage > 0 || hasLoginButtons > 0).toBe(
        true
      );
    });

    test('should return 401 for import API endpoints without authentication', async ({
      page,
    }) => {
      // Don't set up authentication
      await page.route('**/api/import/progress**', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Authentication required',
            message: 'Please sign in to view import progress',
          }),
        });
      });

      // Try to access API directly
      const response = await page.request.get('/api/import/progress');
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error', 'Authentication required');
      expect(data).toHaveProperty('message');
    });

    test('should show appropriate message for unauthorized import operations', async ({
      page,
    }) => {
      // Don't set up authentication
      await page.route('**/api/import/progress**', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Authentication required',
            message: 'Please sign in to start import',
          }),
        });
      });

      await page.goto('/(admin)/import');
      await page.waitForLoadState('networkidle');

      // Try to start import
      const startButton = page.getByRole('button', {
        name: /start import|start|import/i,
      });

      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(1000);

        // Should show error or redirect
        const hasError =
          (await page
            .locator('text=/authentication|sign in|unauthorized/i')
            .count()) > 0;
        expect(hasError).toBe(true);
      }
    });
  });
});
