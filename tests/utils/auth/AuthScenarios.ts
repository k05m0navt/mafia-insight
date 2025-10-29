import { Page, expect } from '@playwright/test';
import { testLogger } from '../logging/TestLogger';
import { AuthTestUtils, UserCredentials } from './AuthTestUtils';

export interface AuthTestConfig {
  baseUrl: string;
  testUsers: {
    admin: UserCredentials;
    user: UserCredentials;
    guest: UserCredentials;
  };
  timeout: number;
  retries: number;
}

export class AuthScenarios {
  private utils: AuthTestUtils;
  private config: AuthTestConfig;

  constructor(config: AuthTestConfig) {
    this.config = config;
    this.utils = new AuthTestUtils(config);
  }

  async successfulLogin(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting successful login scenario', {
      email: credentials.email,
    });

    await this.utils.navigateToLogin(page);
    await this.utils.fillLoginForm(page, credentials);
    await this.utils.submitLoginForm(page);
    await this.utils.waitForLoginSuccess(page);

    testLogger.info('Successful login scenario completed', {
      email: credentials.email,
    });
  }

  async failedLogin(
    page: Page,
    credentials: UserCredentials,
    expectedError?: string
  ): Promise<void> {
    testLogger.info('Starting failed login scenario', {
      email: credentials.email,
    });

    await this.utils.navigateToLogin(page);
    await this.utils.fillLoginForm(page, credentials);
    await this.utils.submitLoginForm(page);
    await this.utils.waitForLoginError(page, expectedError);

    testLogger.info('Failed login scenario completed', {
      email: credentials.email,
    });
  }

  async loginWithEmptyFields(page: Page): Promise<void> {
    testLogger.info('Starting login with empty fields scenario');

    await this.utils.navigateToLogin(page);
    await this.utils.submitLoginForm(page);

    // Check for validation errors
    await this.utils.waitForValidationError(page, 'email', 'Email is required');
    await this.utils.waitForValidationError(
      page,
      'password',
      'Password is required'
    );

    testLogger.info('Login with empty fields scenario completed');
  }

  async loginWithInvalidEmail(page: Page, invalidEmail: string): Promise<void> {
    testLogger.info('Starting login with invalid email scenario', {
      invalidEmail,
    });

    await this.utils.navigateToLogin(page);
    await this.utils.fillLoginForm(page, {
      email: invalidEmail,
      password: 'password123',
    });
    await this.utils.submitLoginForm(page);
    await this.utils.waitForValidationError(
      page,
      'email',
      'Invalid email format'
    );

    testLogger.info('Login with invalid email scenario completed', {
      invalidEmail,
    });
  }

  async loginWithWeakPassword(page: Page, weakPassword: string): Promise<void> {
    testLogger.info('Starting login with weak password scenario');

    await this.utils.navigateToLogin(page);
    await this.utils.fillLoginForm(page, {
      email: 'test@example.com',
      password: weakPassword,
    });
    await this.utils.submitLoginForm(page);
    await this.utils.waitForValidationError(
      page,
      'password',
      'Password is too weak'
    );

    testLogger.info('Login with weak password scenario completed');
  }

  async loginWithNetworkError(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting login with network error scenario', {
      email: credentials.email,
    });

    await this.utils.navigateToLogin(page);

    // Mock network error
    await this.utils.mockApiError(page, '**/api/auth/login', 500);

    await this.utils.fillLoginForm(page, credentials);
    await this.utils.submitLoginForm(page);
    await this.utils.waitForLoginError(
      page,
      'Network error. Please try again.'
    );

    await this.utils.clearMocks(page);
    testLogger.info('Login with network error scenario completed', {
      email: credentials.email,
    });
  }

  async loginWithSlowResponse(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting login with slow response scenario', {
      email: credentials.email,
    });

    await this.utils.navigateToLogin(page);

    // Mock slow response
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, email: credentials.email },
          token: 'jwt-token',
        }),
      });
    });

    await this.utils.fillLoginForm(page, credentials);
    await this.utils.submitLoginForm(page);

    // Check loading state
    await this.utils.checkLoadingState(page, 'login-button');

    await this.utils.waitForLoginSuccess(page);
    await this.utils.clearMocks(page);

    testLogger.info('Login with slow response scenario completed', {
      email: credentials.email,
    });
  }

  async successfulSignup(
    page: Page,
    userData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    testLogger.info('Starting successful signup scenario', {
      email: userData.email,
    });

    await this.utils.navigateToSignup(page);
    await this.utils.fillSignupForm(page, userData);
    await this.utils.submitSignupForm(page);
    await this.utils.waitForSignupSuccess(page);

    testLogger.info('Successful signup scenario completed', {
      email: userData.email,
    });
  }

  async signupWithPasswordMismatch(
    page: Page,
    userData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    testLogger.info('Starting signup with password mismatch scenario', {
      email: userData.email,
    });

    await this.utils.navigateToSignup(page);
    await this.utils.fillSignupForm(page, userData);
    await this.utils.submitSignupForm(page);
    await this.utils.waitForSignupError(page, 'Passwords do not match');

    testLogger.info('Signup with password mismatch scenario completed', {
      email: userData.email,
    });
  }

  async signupWithExistingEmail(
    page: Page,
    userData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    testLogger.info('Starting signup with existing email scenario', {
      email: userData.email,
    });

    await this.utils.navigateToSignup(page);
    await this.utils.fillSignupForm(page, userData);
    await this.utils.submitSignupForm(page);
    await this.utils.waitForSignupError(page, 'Email already exists');

    testLogger.info('Signup with existing email scenario completed', {
      email: userData.email,
    });
  }

  async signupWithWeakPassword(
    page: Page,
    userData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    testLogger.info('Starting signup with weak password scenario', {
      email: userData.email,
    });

    await this.utils.navigateToSignup(page);
    await this.utils.fillSignupForm(page, userData);
    await this.utils.submitSignupForm(page);
    await this.utils.waitForValidationError(
      page,
      'password',
      'Password must be at least 8 characters'
    );

    testLogger.info('Signup with weak password scenario completed', {
      email: userData.email,
    });
  }

  async signupWithInvalidEmail(
    page: Page,
    userData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    testLogger.info('Starting signup with invalid email scenario', {
      email: userData.email,
    });

    await this.utils.navigateToSignup(page);
    await this.utils.fillSignupForm(page, userData);
    await this.utils.submitSignupForm(page);
    await this.utils.waitForValidationError(
      page,
      'email',
      'Invalid email format'
    );

    testLogger.info('Signup with invalid email scenario completed', {
      email: userData.email,
    });
  }

  async signupWithEmptyFields(page: Page): Promise<void> {
    testLogger.info('Starting signup with empty fields scenario');

    await this.utils.navigateToSignup(page);
    await this.utils.submitSignupForm(page);

    // Check for validation errors
    await this.utils.waitForValidationError(page, 'name', 'Name is required');
    await this.utils.waitForValidationError(page, 'email', 'Email is required');
    await this.utils.waitForValidationError(
      page,
      'password',
      'Password is required'
    );
    await this.utils.waitForValidationError(
      page,
      'confirmPassword',
      'Confirm password is required'
    );

    testLogger.info('Signup with empty fields scenario completed');
  }

  async successfulLogout(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting successful logout scenario', {
      email: credentials.email,
    });

    // First login
    await this.utils.performLogin(page, credentials);

    // Then logout
    await this.utils.performLogout(page);

    testLogger.info('Successful logout scenario completed', {
      email: credentials.email,
    });
  }

  async logoutWithConfirmation(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting logout with confirmation scenario', {
      email: credentials.email,
    });

    // First login
    await this.utils.performLogin(page, credentials);

    // Then logout with confirmation
    await this.utils.performLogoutWithConfirmation(page);

    testLogger.info('Logout with confirmation scenario completed', {
      email: credentials.email,
    });
  }

  async logoutWithUnsavedChanges(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting logout with unsaved changes scenario', {
      email: credentials.email,
    });

    // First login
    await this.utils.performLogin(page, credentials);

    // Navigate to a page with form data
    await page.goto('/analytics/players');
    await this.utils.fillElement(
      page,
      '[data-testid="search-input"]',
      'test search'
    );

    // Try to logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-option"]');

    // Check that unsaved changes warning is shown
    await expect(
      page.locator('[data-testid="unsaved-changes-warning"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="unsaved-changes-warning"]')
    ).toContainText('You have unsaved changes');

    // Click discard
    await page.click('[data-testid="discard-changes-button"]');
    await expect(page).toHaveURL(/\/login/);

    testLogger.info('Logout with unsaved changes scenario completed', {
      email: credentials.email,
    });
  }

  async logoutWithSessionTimeout(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting logout with session timeout scenario', {
      email: credentials.email,
    });

    // First login
    await this.utils.performLogin(page, credentials);

    // Simulate session timeout
    await page.evaluate(() => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('session-timeout'));
      }, 1000);
    });

    // Wait for session timeout event
    await page.waitForEvent('session-timeout');
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.locator('[data-testid="session-timeout-message"]')
    ).toBeVisible();

    testLogger.info('Logout with session timeout scenario completed', {
      email: credentials.email,
    });
  }

  async adminAccessToAdminPages(
    page: Page,
    adminCredentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting admin access to admin pages scenario', {
      email: adminCredentials.email,
    });

    // Login as admin
    await this.utils.performLogin(page, adminCredentials);

    // Check admin role
    await this.utils.checkUserRole(page, 'admin');

    // Navigate to admin pages
    await page.goto('/admin/users');
    await expect(
      page.locator('[data-testid="admin-users-page"]')
    ).toBeVisible();

    // Check admin navigation
    await this.utils.checkAdminNavigationVisible(page);

    testLogger.info('Admin access to admin pages scenario completed', {
      email: adminCredentials.email,
    });
  }

  async userDeniedAccessToAdminPages(
    page: Page,
    userCredentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting user denied access to admin pages scenario', {
      email: userCredentials.email,
    });

    // Login as user
    await this.utils.performLogin(page, userCredentials);

    // Check user role
    await this.utils.checkUserRole(page, 'user');

    // Try to access admin pages
    await page.goto('/admin/users');
    await this.utils.checkUnauthorizedAccess(page);

    // Check that admin navigation is hidden
    await this.utils.checkAdminNavigationHidden(page);

    testLogger.info('User denied access to admin pages scenario completed', {
      email: userCredentials.email,
    });
  }

  async roleBasedNavigation(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting role-based navigation scenario', {
      email: credentials.email,
      role: credentials.role,
    });

    // Login
    await this.utils.performLogin(page, credentials);

    // Check role
    await this.utils.checkUserRole(page, credentials.role || 'user');

    if (credentials.role === 'admin') {
      await this.utils.checkAdminNavigationVisible(page);
    } else {
      await this.utils.checkAdminNavigationHidden(page);
    }

    testLogger.info('Role-based navigation scenario completed', {
      email: credentials.email,
      role: credentials.role,
    });
  }

  async dynamicRoleChange(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting dynamic role change scenario', {
      email: credentials.email,
    });

    // Login as user
    await this.utils.performLogin(page, credentials);
    await this.utils.checkUserRole(page, 'user');
    await this.utils.checkAdminNavigationHidden(page);

    // Simulate role change
    await page.evaluate(() => {
      localStorage.setItem('userRole', 'admin');
      window.dispatchEvent(
        new CustomEvent('roleChanged', { detail: { role: 'admin' } })
      );
    });

    // Wait for role change
    await page.waitForTimeout(1000);

    // Check that admin navigation is now visible
    await this.utils.checkAdminNavigationVisible(page);
    await this.utils.checkUserRole(page, 'admin');

    testLogger.info('Dynamic role change scenario completed', {
      email: credentials.email,
    });
  }

  async apiLevelRolePermissions(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting API-level role permissions scenario', {
      email: credentials.email,
      role: credentials.role,
    });

    // Login
    await this.utils.performLogin(page, credentials);

    // Try to make admin API call
    const response = await page.request.post('/api/admin/users', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      },
    });

    if (credentials.role === 'admin') {
      expect(response.status()).toBe(200);
    } else {
      expect(response.status()).toBe(403);
      const responseData = await response.json();
      expect(responseData.error).toContain('Access denied');
    }

    testLogger.info('API-level role permissions scenario completed', {
      email: credentials.email,
      role: credentials.role,
    });
  }

  async sessionPersistence(
    page: Page,
    credentials: UserCredentials
  ): Promise<void> {
    testLogger.info('Starting session persistence scenario', {
      email: credentials.email,
    });

    // Login
    await this.utils.performLogin(page, credentials);

    // Navigate to a protected page
    await page.goto('/analytics/players');
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();

    // Refresh the page
    await page.reload();

    // Should still be logged in and on the same page
    await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    testLogger.info('Session persistence scenario completed', {
      email: credentials.email,
    });
  }

  async passwordVisibilityToggle(page: Page): Promise<void> {
    testLogger.info('Starting password visibility toggle scenario');

    await this.utils.navigateToLogin(page);

    // Check that password visibility toggle is present
    await expect(page.locator('[data-testid="password-toggle"]')).toBeVisible();

    // Fill in password
    await this.utils.fillElement(
      page,
      '[data-testid="password-input"]',
      'password123'
    );

    // Check that password is hidden by default
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await page.click('[data-testid="password-toggle"]');
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await page.click('[data-testid="password-toggle"]');
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'password');

    testLogger.info('Password visibility toggle scenario completed');
  }

  async formValidation(
    page: Page,
    formType: 'login' | 'signup'
  ): Promise<void> {
    testLogger.info('Starting form validation scenario', { formType });

    if (formType === 'login') {
      await this.utils.navigateToLogin(page);

      // Try to submit empty form
      await this.utils.submitLoginForm(page);
      await this.utils.waitForValidationError(
        page,
        'email',
        'Email is required'
      );
      await this.utils.waitForValidationError(
        page,
        'password',
        'Password is required'
      );

      // Fill in email only
      await this.utils.fillElement(
        page,
        '[data-testid="email-input"]',
        'test@example.com'
      );
      await this.utils.submitLoginForm(page);
      await this.utils.waitForValidationError(
        page,
        'password',
        'Password is required'
      );
    } else {
      await this.utils.navigateToSignup(page);

      // Try to submit empty form
      await this.utils.submitSignupForm(page);
      await this.utils.waitForValidationError(page, 'name', 'Name is required');
      await this.utils.waitForValidationError(
        page,
        'email',
        'Email is required'
      );
      await this.utils.waitForValidationError(
        page,
        'password',
        'Password is required'
      );
      await this.utils.waitForValidationError(
        page,
        'confirmPassword',
        'Confirm password is required'
      );
    }

    testLogger.info('Form validation scenario completed', { formType });
  }

  async accessibilityTest(
    page: Page,
    formType: 'login' | 'signup'
  ): Promise<void> {
    testLogger.info('Starting accessibility test scenario', { formType });

    if (formType === 'login') {
      await this.utils.navigateToLogin(page);

      // Check ARIA labels
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
        'aria-label',
        'Email'
      );
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toHaveAttribute('aria-label', 'Password');
      await expect(
        page.locator('[data-testid="login-button"]')
      ).toHaveAttribute('aria-label', 'Login');
    } else {
      await this.utils.navigateToSignup(page);

      // Check ARIA labels
      await expect(page.locator('[data-testid="name-input"]')).toHaveAttribute(
        'aria-label',
        'Name'
      );
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
        'aria-label',
        'Email'
      );
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toHaveAttribute('aria-label', 'Password');
      await expect(
        page.locator('[data-testid="confirm-password-input"]')
      ).toHaveAttribute('aria-label', 'Confirm Password');
      await expect(
        page.locator('[data-testid="signup-button"]')
      ).toHaveAttribute('aria-label', 'Sign Up');
    }

    testLogger.info('Accessibility test scenario completed', { formType });
  }

  async keyboardNavigation(
    page: Page,
    formType: 'login' | 'signup'
  ): Promise<void> {
    testLogger.info('Starting keyboard navigation scenario', { formType });

    if (formType === 'login') {
      await this.utils.navigateToLogin(page);

      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      const loginButton = page.locator('[data-testid="login-button"]');

      // Test tab navigation
      await emailInput.focus();
      await expect(emailInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(passwordInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(loginButton).toBeFocused();
    } else {
      await this.utils.navigateToSignup(page);

      const nameInput = page.locator('[data-testid="name-input"]');
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = page.locator(
        '[data-testid="confirm-password-input"]'
      );
      const signupButton = page.locator('[data-testid="signup-button"]');

      // Test tab navigation
      await nameInput.focus();
      await expect(nameInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(emailInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(passwordInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(confirmPasswordInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(signupButton).toBeFocused();
    }

    testLogger.info('Keyboard navigation scenario completed', { formType });
  }
}
