import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Authentication - Role-Based Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
    await testLogger.info(
      'Navigated to login page for role-based access test',
      {
        url: page.url(),
        timestamp: new Date().toISOString(),
      }
    );
  });

  test('should allow admin access to admin-only pages', async ({ page }) => {
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Navigate to admin-only page
    await page.goto('/admin/users');

    // Should have access to admin page
    await expect(
      page.locator('[data-testid="admin-users-page"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="user-management-table"]')
    ).toBeVisible();

    // Check that admin controls are visible
    await expect(
      page.locator('[data-testid="create-user-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="delete-user-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="edit-user-button"]')
    ).toBeVisible();

    await testLogger.info('Admin access test passed', {
      test: 'should allow admin access to admin-only pages',
    });
  });

  test('should deny regular user access to admin-only pages', async ({
    page,
  }) => {
    // Login as regular user
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Try to navigate to admin-only page
    await page.goto('/admin/users');

    // Should be redirected to unauthorized page or dashboard
    await expect(page).toHaveURL(/\/unauthorized|\/dashboard/);

    // Check that error message is shown
    await expect(
      page.locator('[data-testid="unauthorized-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="unauthorized-message"]')
    ).toContainText('Access denied');

    await testLogger.info('Regular user access denial test passed', {
      test: 'should deny regular user access to admin-only pages',
    });
  });

  test('should show appropriate navigation based on user role', async ({
    page,
  }) => {
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check that admin navigation items are visible
    await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="user-management-link"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="system-settings-link"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="analytics-link"]')).toBeVisible();

    // Check that user role is displayed
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      'admin'
    );

    await testLogger.info('Admin navigation test passed', {
      test: 'should show appropriate navigation based on user role',
    });
  });

  test('should hide admin navigation for regular users', async ({ page }) => {
    // Login as regular user
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check that admin navigation items are hidden
    await expect(page.locator('[data-testid="admin-menu"]')).not.toBeVisible();
    await expect(
      page.locator('[data-testid="user-management-link"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="system-settings-link"]')
    ).not.toBeVisible();

    // Check that user navigation items are visible
    await expect(page.locator('[data-testid="analytics-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-link"]')).toBeVisible();

    // Check that user role is displayed
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      'user'
    );

    await testLogger.info('Regular user navigation test passed', {
      test: 'should hide admin navigation for regular users',
    });
  });

  test('should allow admin to manage user permissions', async ({ page }) => {
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Navigate to user management
    await page.click('[data-testid="user-management-link"]');
    await expect(page).toHaveURL('/admin/users');

    // Click on a user to edit permissions
    await page.click('[data-testid="user-row-1"]');
    await expect(
      page.locator('[data-testid="user-permissions-modal"]')
    ).toBeVisible();

    // Check that permission controls are visible
    await expect(
      page.locator('[data-testid="permission-checkbox-read"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="permission-checkbox-write"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="permission-checkbox-admin"]')
    ).toBeVisible();

    // Toggle a permission
    await page.check('[data-testid="permission-checkbox-write"]');
    await page.click('[data-testid="save-permissions-button"]');

    // Check that success message is shown
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Permissions updated'
    );

    await testLogger.info('User permission management test passed', {
      test: 'should allow admin to manage user permissions',
    });
  });

  test('should prevent regular users from accessing user management', async ({
    page,
  }) => {
    // Login as regular user
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Try to navigate to user management directly
    await page.goto('/admin/users');

    // Should be redirected to unauthorized page
    await expect(page).toHaveURL(/\/unauthorized/);

    // Check that error message is shown
    await expect(
      page.locator('[data-testid="unauthorized-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="unauthorized-message"]')
    ).toContainText('You do not have permission to access this page');

    await testLogger.info('Regular user permission denial test passed', {
      test: 'should prevent regular users from accessing user management',
    });
  });

  test('should show different content based on user role', async ({ page }) => {
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check that admin-specific content is visible
    await expect(
      page.locator('[data-testid="admin-dashboard-widget"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="system-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-users"]')).toBeVisible();

    // Logout and login as regular user
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');
    await expect(page).toHaveURL('/login');

    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check that admin-specific content is hidden
    await expect(
      page.locator('[data-testid="admin-dashboard-widget"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="system-stats"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="recent-users"]')
    ).not.toBeVisible();

    // Check that user-specific content is visible
    await expect(
      page.locator('[data-testid="user-dashboard-widget"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="personal-stats"]')).toBeVisible();

    await testLogger.info('Role-based content display test passed', {
      test: 'should show different content based on user role',
    });
  });

  test('should handle role changes dynamically', async ({ page }) => {
    // Login as regular user
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check that user role is displayed
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      'user'
    );

    // Simulate role change (this would typically be done by an admin)
    await page.evaluate(() => {
      // Simulate role change by updating localStorage or making API call
      localStorage.setItem('userRole', 'admin');
      window.dispatchEvent(
        new CustomEvent('roleChanged', { detail: { role: 'admin' } })
      );
    });

    // Wait for role change to take effect
    await page.waitForTimeout(1000);

    // Check that admin navigation is now visible
    await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="user-management-link"]')
    ).toBeVisible();

    // Check that user role is updated
    await expect(page.locator('[data-testid="user-role"]')).toContainText(
      'admin'
    );

    await testLogger.info('Dynamic role change test passed', {
      test: 'should handle role changes dynamically',
    });
  });

  test('should enforce API-level role permissions', async ({ page }) => {
    // Login as regular user
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Try to make admin API call
    const response = await page.request.post('/api/admin/users', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      },
    });

    // Should receive 403 Forbidden
    expect(response.status()).toBe(403);

    const responseData = await response.json();
    expect(responseData.error).toContain('Access denied');

    await testLogger.info('API-level role permission enforcement test passed', {
      test: 'should enforce API-level role permissions',
    });
  });

  test('should show appropriate error messages for unauthorized access', async ({
    page,
  }) => {
    // Login as regular user
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'user123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Try to access admin page
    await page.goto('/admin/users');

    // Should be redirected to unauthorized page
    await expect(page).toHaveURL(/\/unauthorized/);

    // Check that appropriate error message is shown
    await expect(
      page.locator('[data-testid="unauthorized-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="unauthorized-message"]')
    ).toContainText('You do not have permission to access this page');

    // Check that back button is available
    await expect(page.locator('[data-testid="back-button"]')).toBeVisible();

    // Check that contact admin link is available
    await expect(
      page.locator('[data-testid="contact-admin-link"]')
    ).toBeVisible();

    await testLogger.info('Unauthorized access error message test passed', {
      test: 'should show appropriate error messages for unauthorized access',
    });
  });

  test('should maintain role-based access after page refresh', async ({
    page,
  }) => {
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Navigate to admin page
    await page.goto('/admin/users');
    await expect(
      page.locator('[data-testid="admin-users-page"]')
    ).toBeVisible();

    // Refresh the page
    await page.reload();

    // Should still have access to admin page
    await expect(
      page.locator('[data-testid="admin-users-page"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="user-management-table"]')
    ).toBeVisible();

    // Check that admin navigation is still visible
    await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();

    await testLogger.info('Role persistence after refresh test passed', {
      test: 'should maintain role-based access after page refresh',
    });
  });
});
