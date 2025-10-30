import { test, expect } from '@playwright/test';
import { testLogger } from '../../utils/logging/TestLogger';

test.describe('Authentication - Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to registration page before each test
    await page.goto('/register');
    await testLogger.info('Navigated to registration page', {
      url: page.url(),
      timestamp: new Date().toISOString(),
    });
  });

  test('should display registration form with required fields', async ({
    page,
  }) => {
    // Check that registration form is visible
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();

    // Check that email input is present
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
      'type',
      'email'
    );
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
      'required'
    );

    // Check that password input is present
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'password');
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('required');

    // Check that confirm password input is present
    await expect(
      page.locator('[data-testid="confirm-password-input"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-input"]')
    ).toHaveAttribute('type', 'password');
    await expect(
      page.locator('[data-testid="confirm-password-input"]')
    ).toHaveAttribute('required');

    // Check that name input is present
    await expect(page.locator('[data-testid="name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-input"]')).toHaveAttribute(
      'type',
      'text'
    );
    await expect(page.locator('[data-testid="name-input"]')).toHaveAttribute(
      'required'
    );

    // Check that terms checkbox is present
    await expect(page.locator('[data-testid="terms-checkbox"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="terms-checkbox"]')
    ).toHaveAttribute('type', 'checkbox');

    // Check that register button is present
    await expect(page.locator('[data-testid="register-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-button"]')).toBeEnabled();

    // Check that login link is present
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();

    await testLogger.info('Registration form validation passed', {
      test: 'should display registration form with required fields',
    });
  });

  test('should register successfully with valid data', async ({ page }) => {
    // Fill in valid registration data
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Wait for success message
    await expect(
      page.locator('[data-testid="registration-success"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="registration-success"]')
    ).toContainText('Registration successful');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Check that user menu is visible (indicating successful registration)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Check that welcome message is displayed
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(
      'Welcome, John'
    );

    await testLogger.info('Successful registration test passed', {
      test: 'should register successfully with valid data',
      email: 'john.doe@example.com',
    });
  });

  test('should show error with invalid email format', async ({ page }) => {
    // Fill in invalid email format
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Check that validation error is shown
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      'Please enter a valid email address'
    );

    // Check that we're still on registration page
    await expect(page).toHaveURL('/register');

    await testLogger.info('Invalid email format test passed', {
      test: 'should show error with invalid email format',
    });
  });

  test('should show error with password mismatch', async ({ page }) => {
    // Fill in data with mismatched passwords
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill(
      '[data-testid="confirm-password-input"]',
      'differentpassword'
    );
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Check that validation error is shown
    await expect(
      page.locator('[data-testid="confirm-password-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-error"]')
    ).toContainText('Passwords do not match');

    // Check that we're still on registration page
    await expect(page).toHaveURL('/register');

    await testLogger.info('Password mismatch test passed', {
      test: 'should show error with password mismatch',
    });
  });

  test('should show error with weak password', async ({ page }) => {
    // Fill in data with weak password
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', '123');
    await page.fill('[data-testid="confirm-password-input"]', '123');
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Check that validation error is shown
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      'Password must be at least 8 characters long'
    );

    // Check that we're still on registration page
    await expect(page).toHaveURL('/register');

    await testLogger.info('Weak password test passed', {
      test: 'should show error with weak password',
    });
  });

  test('should show error with empty name', async ({ page }) => {
    // Fill in data without name
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Check that validation error is shown
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="name-error"]')).toContainText(
      'Name is required'
    );

    // Check that we're still on registration page
    await expect(page).toHaveURL('/register');

    await testLogger.info('Empty name test passed', {
      test: 'should show error with empty name',
    });
  });

  test('should show error when terms not accepted', async ({ page }) => {
    // Fill in valid data but don't check terms
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Check that validation error is shown
    await expect(page.locator('[data-testid="terms-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="terms-error"]')).toContainText(
      'You must accept the terms and conditions'
    );

    // Check that we're still on registration page
    await expect(page).toHaveURL('/register');

    await testLogger.info('Terms not accepted test passed', {
      test: 'should show error when terms not accepted',
    });
  });

  test('should show error with existing email', async ({ page }) => {
    // Fill in data with existing email
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Wait for error message to appear
    await expect(
      page.locator('[data-testid="registration-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="registration-error"]')
    ).toContainText('Email already exists');

    // Check that we're still on registration page
    await expect(page).toHaveURL('/register');

    // Check that form is still functional
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();

    await testLogger.info('Existing email test passed', {
      test: 'should show error with existing email',
    });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/register', (route) => {
      route.abort('failed');
    });

    // Fill in valid data
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Wait for error message to appear
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText(
      'Network error. Please try again.'
    );

    // Check that we're still on registration page
    await expect(page).toHaveURL('/register');

    await testLogger.info('Network error test passed', {
      test: 'should handle network errors gracefully',
    });
  });

  test('should show loading state during registration', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/auth/register', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, email: 'john.doe@example.com', name: 'John Doe' },
        }),
      });
    });

    // Fill in valid data
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Check that loading state is shown
    await expect(
      page.locator('[data-testid="registration-loading"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="register-button"]')
    ).toBeDisabled();

    // Wait for registration to complete
    await expect(page).toHaveURL('/dashboard');

    await testLogger.info('Loading state test passed', {
      test: 'should show loading state during registration',
    });
  });

  test('should validate password strength in real-time', async ({ page }) => {
    // Fill in weak password
    await page.fill('[data-testid="password-input"]', '123');

    // Check that password strength indicator shows weak
    await expect(
      page.locator('[data-testid="password-strength-indicator"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="password-strength-indicator"]')
    ).toHaveClass(/weak/);

    // Improve password
    await page.fill('[data-testid="password-input"]', 'password123');

    // Check that password strength indicator shows strong
    await expect(
      page.locator('[data-testid="password-strength-indicator"]')
    ).toHaveClass(/strong/);

    await testLogger.info('Password strength validation test passed', {
      test: 'should validate password strength in real-time',
    });
  });

  test('should show password visibility toggle', async ({ page }) => {
    // Check that password visibility toggle is present
    await expect(page.locator('[data-testid="password-toggle"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-toggle"]')
    ).toBeVisible();

    // Fill in passwords
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');

    // Check that passwords are hidden by default
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'password');
    await expect(
      page.locator('[data-testid="confirm-password-input"]')
    ).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await page.click('[data-testid="password-toggle"]');

    // Check that password is now visible
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await page.click('[data-testid="password-toggle"]');

    // Check that password is hidden again
    await expect(
      page.locator('[data-testid="password-input"]')
    ).toHaveAttribute('type', 'password');

    await testLogger.info('Password visibility toggle test passed', {
      test: 'should show password visibility toggle',
    });
  });

  test('should validate form on submit', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="register-button"]');

    // Check that all required fields show validation errors
    await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-error"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="terms-error"]')).toBeVisible();

    // Fill in name only
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.click('[data-testid="register-button"]');

    // Check that name error is gone but others remain
    await expect(page.locator('[data-testid="name-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-password-error"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="terms-error"]')).toBeVisible();

    // Fill in all fields
    await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.check('[data-testid="terms-checkbox"]');
    await page.click('[data-testid="register-button"]');

    // Should proceed with registration
    await expect(page).toHaveURL('/dashboard');

    await testLogger.info('Form validation test passed', {
      test: 'should validate form on submit',
    });
  });

  test('should redirect to login page from registration', async ({ page }) => {
    // Click on login link
    await page.click('[data-testid="login-link"]');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');

    // Check that login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    await testLogger.info('Redirect to login test passed', {
      test: 'should redirect to login page from registration',
    });
  });

  test('should handle registration with special characters in name', async ({
    page,
  }) => {
    // Fill in data with special characters in name
    await page.fill('[data-testid="name-input"]', "José María O'Connor-Smith");
    await page.fill('[data-testid="email-input"]', 'jose.maria@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Should register successfully
    await expect(page).toHaveURL('/dashboard');

    // Check that welcome message shows the name correctly
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(
      'José María'
    );

    await testLogger.info('Special characters in name test passed', {
      test: 'should handle registration with special characters in name',
    });
  });

  test('should handle registration with international email domains', async ({
    page,
  }) => {
    // Fill in data with international email domain
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await page.fill('[data-testid="email-input"]', 'john.doe@example.co.uk');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.check('[data-testid="terms-checkbox"]');

    // Click register button
    await page.click('[data-testid="register-button"]');

    // Should register successfully
    await expect(page).toHaveURL('/dashboard');

    // Check that user menu is visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    await testLogger.info('International email domain test passed', {
      test: 'should handle registration with international email domains',
    });
  });
});
