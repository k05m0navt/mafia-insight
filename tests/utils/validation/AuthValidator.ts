import { Page, expect } from '@playwright/test';
import { testLogger } from '../logging/TestLogger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface PasswordValidationResult extends ValidationResult {
  strength: 'weak' | 'medium' | 'strong';
  score: number; // 0-100
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
    noCommonWords: boolean;
    noPersonalInfo: boolean;
  };
}

export interface EmailValidationResult extends ValidationResult {
  format: boolean;
  domain: boolean;
  mx: boolean;
  disposable: boolean;
  role: boolean;
}

export interface FormValidationResult extends ValidationResult {
  fields: Record<
    string,
    {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    }
  >;
}

export interface SessionValidationResult extends ValidationResult {
  isActive: boolean;
  isExpired: boolean;
  isValid: boolean;
  permissions: string[];
  role: string;
  expiresAt?: Date;
}

export interface TokenValidationResult extends ValidationResult {
  isExpired: boolean;
  isValid: boolean;
  payload?: Record<string, unknown>;
  issuedAt?: Date;
  expiresAt?: Date;
}

export class AuthValidator {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Validates password strength and requirements
   */
  public async validatePassword(
    password: string,
    userInfo?: { name?: string; email?: string }
  ): Promise<PasswordValidationResult> {
    testLogger.info('Validating password', { passwordLength: password.length });

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      specialChars: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      noCommonWords: !this.isCommonPassword(password),
      noPersonalInfo: !this.containsPersonalInfo(password, userInfo),
    };

    // Check length
    if (!requirements.length) {
      errors.push('Password must be at least 8 characters long');
    }

    // Check uppercase
    if (!requirements.uppercase) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check lowercase
    if (!requirements.lowercase) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check numbers
    if (!requirements.numbers) {
      errors.push('Password must contain at least one number');
    }

    // Check special characters
    if (!requirements.specialChars) {
      errors.push('Password must contain at least one special character');
    }

    // Check common words
    if (!requirements.noCommonWords) {
      warnings.push('Password contains common words that are easy to guess');
      suggestions.push('Use a more unique password');
    }

    // Check personal info
    if (!requirements.noPersonalInfo) {
      warnings.push('Password contains personal information');
      suggestions.push('Avoid using personal information in your password');
    }

    // Calculate strength score
    let score = 0;
    if (requirements.length) score += 20;
    if (requirements.uppercase) score += 15;
    if (requirements.lowercase) score += 15;
    if (requirements.numbers) score += 15;
    if (requirements.specialChars) score += 15;
    if (requirements.noCommonWords) score += 10;
    if (requirements.noPersonalInfo) score += 10;

    // Additional length bonus
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score < 50) {
      strength = 'weak';
    } else if (score < 80) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    const isValid = errors.length === 0;

    testLogger.info('Password validation completed', {
      isValid,
      strength,
      score,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return {
      isValid,
      errors,
      warnings,
      suggestions,
      strength,
      score,
      requirements,
    };
  }

  /**
   * Validates email format and properties
   */
  public async validateEmail(email: string): Promise<EmailValidationResult> {
    testLogger.info('Validating email', { email });

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const format = emailRegex.test(email);

    if (!format) {
      errors.push('Invalid email format');
    }

    // Domain validation
    const domain = email.split('@')[1];
    const domainValid = domain && domain.length > 0 && !domain.includes('..');

    if (!domainValid) {
      errors.push('Invalid domain format');
    }

    // Check for disposable email
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com',
      'temp-mail.org',
    ];
    const isDisposable = disposableDomains.some((domain) =>
      email.toLowerCase().includes(domain)
    );

    if (isDisposable) {
      warnings.push('This appears to be a disposable email address');
      suggestions.push(
        'Use a permanent email address for better account security'
      );
    }

    // Check for role-based email
    const rolePrefixes = [
      'admin',
      'support',
      'info',
      'contact',
      'sales',
      'marketing',
    ];
    const isRole = rolePrefixes.some((prefix) =>
      email.toLowerCase().startsWith(prefix + '@')
    );

    if (isRole) {
      warnings.push('This appears to be a role-based email address');
      suggestions.push('Use a personal email address for your account');
    }

    // MX record validation (mock)
    const mx = true; // In real implementation, this would check MX records

    const isValid = errors.length === 0;

    testLogger.info('Email validation completed', {
      email,
      isValid,
      format,
      domainValid,
      isDisposable,
      isRole,
    });

    return {
      isValid,
      errors,
      warnings,
      suggestions,
      format,
      domain: domainValid,
      mx,
      disposable: isDisposable,
      role: isRole,
    };
  }

  /**
   * Validates form fields and their values
   */
  public async validateForm(
    formSelector: string,
    rules: Record<string, unknown>
  ): Promise<FormValidationResult> {
    testLogger.info('Validating form', { formSelector });

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const fields: Record<
      string,
      { isValid: boolean; errors: string[]; warnings: string[] }
    > = {};

    const form = this.page.locator(formSelector);
    await expect(form).toBeVisible();

    // Validate each field
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const field = form.locator(
        `[name="${fieldName}"], [data-testid="${fieldName}"]`
      );
      const value = await field.inputValue();
      const fieldErrors: string[] = [];
      const fieldWarnings: string[] = [];

      // Required validation
      if (fieldRules.required && (!value || value.trim() === '')) {
        fieldErrors.push(`${fieldName} is required`);
      }

      // Length validation
      if (
        value &&
        fieldRules.minLength &&
        value.length < fieldRules.minLength
      ) {
        fieldErrors.push(
          `${fieldName} must be at least ${fieldRules.minLength} characters long`
        );
      }

      if (
        value &&
        fieldRules.maxLength &&
        value.length > fieldRules.maxLength
      ) {
        fieldErrors.push(
          `${fieldName} must be no more than ${fieldRules.maxLength} characters long`
        );
      }

      // Pattern validation
      if (
        value &&
        fieldRules.pattern &&
        !new RegExp(fieldRules.pattern).test(value)
      ) {
        fieldErrors.push(`${fieldName} format is invalid`);
      }

      // Custom validation
      if (value && fieldRules.custom) {
        const customResult = await fieldRules.custom(value);
        if (!customResult.isValid) {
          fieldErrors.push(...customResult.errors);
          fieldWarnings.push(...customResult.warnings);
        }
      }

      fields[fieldName] = {
        isValid: fieldErrors.length === 0,
        errors: fieldErrors,
        warnings: fieldWarnings,
      };

      errors.push(...fieldErrors);
      warnings.push(...fieldWarnings);
    }

    const isValid = errors.length === 0;

    testLogger.info('Form validation completed', {
      formSelector,
      isValid,
      fieldCount: Object.keys(fields).length,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return {
      isValid,
      errors,
      warnings,
      suggestions,
      fields,
    };
  }

  /**
   * Validates user session
   */
  public async validateSession(): Promise<SessionValidationResult> {
    testLogger.info('Validating user session');

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check if user is logged in
    const userMenu = this.page.locator('[data-testid="user-menu"]');
    const isLoggedIn = await userMenu.isVisible();

    if (!isLoggedIn) {
      errors.push('User is not logged in');
      return {
        isValid: false,
        errors,
        warnings,
        suggestions,
        isActive: false,
        isExpired: true,
        permissions: [],
        role: 'guest',
      };
    }

    // Check session token
    const token = await this.page.evaluate(() =>
      localStorage.getItem('authToken')
    );
    if (!token) {
      errors.push('No authentication token found');
    }

    // Check refresh token
    const refreshToken = await this.page.evaluate(() =>
      localStorage.getItem('refreshToken')
    );
    if (!refreshToken) {
      warnings.push('No refresh token found');
    }

    // Check user role
    const role =
      (await this.page.evaluate(() => localStorage.getItem('userRole'))) ||
      'user';

    // Check permissions (mock)
    const permissions = this.getPermissionsForRole(role);

    // Check session expiration (mock)
    const isExpired = false; // In real implementation, this would check token expiration

    const isActive = isLoggedIn && !isExpired;
    const isValid = errors.length === 0;

    testLogger.info('Session validation completed', {
      isLoggedIn,
      isActive,
      isExpired,
      role,
      permissionCount: permissions.length,
    });

    return {
      isValid,
      errors,
      warnings,
      suggestions,
      isActive,
      isExpired,
      permissions,
      role,
    };
  }

  /**
   * Validates JWT token
   */
  public async validateToken(token: string): Promise<TokenValidationResult> {
    testLogger.info('Validating JWT token');

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!token) {
      errors.push('Token is missing');
      return {
        isValid: false,
        errors,
        warnings,
        suggestions,
        isExpired: true,
      };
    }

    try {
      // Decode JWT token (mock implementation)
      const parts = token.split('.');
      if (parts.length !== 3) {
        errors.push('Invalid token format');
        return {
          isValid: false,
          errors,
          warnings,
          suggestions,
          isExpired: true,
        };
      }

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      // Check expiration
      const isExpired = payload.exp && payload.exp < now;
      if (isExpired) {
        errors.push('Token has expired');
      }

      // Check issued at
      const issuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined;
      if (issuedAt && issuedAt > new Date()) {
        warnings.push('Token issued in the future');
      }

      // Check expiration time
      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined;

      const isValid = errors.length === 0;

      testLogger.info('Token validation completed', {
        isValid,
        isExpired,
        issuedAt,
        expiresAt,
      });

      return {
        isValid,
        errors,
        warnings,
        suggestions,
        isExpired,
        payload,
        issuedAt,
        expiresAt,
      };
    } catch (_error) {
      errors.push('Invalid token format');
      return {
        isValid: false,
        errors,
        warnings,
        suggestions,
        isExpired: true,
      };
    }
  }

  /**
   * Validates role-based access
   */
  public async validateRoleAccess(
    requiredRole: string,
    requiredPermissions: string[]
  ): Promise<ValidationResult> {
    testLogger.info('Validating role-based access', {
      requiredRole,
      requiredPermissions,
    });

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Get current user role
    const currentRole =
      (await this.page.evaluate(() => localStorage.getItem('userRole'))) ||
      'guest';

    // Check role hierarchy
    const roleHierarchy = ['guest', 'user', 'admin'];
    const currentRoleIndex = roleHierarchy.indexOf(currentRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (currentRoleIndex < requiredRoleIndex) {
      errors.push(
        `Insufficient role. Required: ${requiredRole}, Current: ${currentRole}`
      );
    }

    // Check permissions
    const currentPermissions = this.getPermissionsForRole(currentRole);
    const missingPermissions = requiredPermissions.filter(
      (permission) => !currentPermissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      errors.push(`Missing permissions: ${missingPermissions.join(', ')}`);
    }

    const isValid = errors.length === 0;

    testLogger.info('Role-based access validation completed', {
      currentRole,
      requiredRole,
      isValid,
      missingPermissions,
    });

    return {
      isValid,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validates form accessibility
   */
  public async validateAccessibility(
    formSelector: string
  ): Promise<ValidationResult> {
    testLogger.info('Validating form accessibility', { formSelector });

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const form = this.page.locator(formSelector);
    await expect(form).toBeVisible();

    // Check for form labels
    const inputs = form.locator('input, select, textarea');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const _inputName = await input.getAttribute('name');
      const inputAriaLabel = await input.getAttribute('aria-label');
      const inputAriaLabelledBy = await input.getAttribute('aria-labelledby');

      // Check for label
      if (inputId) {
        const label = form.locator(`label[for="${inputId}"]`);
        const hasLabel = (await label.count()) > 0;

        if (!hasLabel && !inputAriaLabel && !inputAriaLabelledBy) {
          errors.push(`Input ${inputId} is missing a label or aria-label`);
        }
      }

      // Check for required indicator
      const isRequired = await input.getAttribute('required');
      if (isRequired) {
        const label = form.locator(`label[for="${inputId}"]`);
        const labelText = await label.textContent();
        if (
          labelText &&
          !labelText.includes('*') &&
          !labelText.includes('required')
        ) {
          warnings.push(
            `Required input ${inputId} should have a visual indicator`
          );
        }
      }
    }

    // Check for error messages
    const errorMessages = form.locator('[role="alert"], .error, .invalid');
    const errorCount = await errorMessages.count();

    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i);
        const errorText = await error.textContent();
        if (!errorText || errorText.trim() === '') {
          warnings.push('Error message is empty or not visible');
        }
      }
    }

    const isValid = errors.length === 0;

    testLogger.info('Accessibility validation completed', {
      formSelector,
      isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return {
      isValid,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validates form keyboard navigation
   */
  public async validateKeyboardNavigation(
    formSelector: string
  ): Promise<ValidationResult> {
    testLogger.info('Validating keyboard navigation', { formSelector });

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const form = this.page.locator(formSelector);
    await expect(form).toBeVisible();

    // Check tab order
    const focusableElements = form.locator(
      'input, select, textarea, button, [tabindex]'
    );
    const elementCount = await focusableElements.count();

    if (elementCount === 0) {
      warnings.push('No focusable elements found in form');
      return {
        isValid: true,
        errors,
        warnings,
        suggestions,
      };
    }

    // Test tab navigation
    await focusableElements.first().focus();
    let currentIndex = 0;

    for (let i = 0; i < elementCount; i++) {
      const currentElement = focusableElements.nth(currentIndex);
      const isFocused = await currentElement.evaluate(
        (el) => el === document.activeElement
      );

      if (!isFocused) {
        errors.push(`Element ${currentIndex} is not focusable`);
      }

      await this.page.keyboard.press('Tab');
      currentIndex = (currentIndex + 1) % elementCount;
    }

    const isValid = errors.length === 0;

    testLogger.info('Keyboard navigation validation completed', {
      formSelector,
      isValid,
      elementCount,
      errorCount: errors.length,
    });

    return {
      isValid,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Checks if password contains common words
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
      'master',
      'hello',
      'login',
      'princess',
    ];

    return commonPasswords.some((common) =>
      password.toLowerCase().includes(common.toLowerCase())
    );
  }

  /**
   * Checks if password contains personal information
   */
  private containsPersonalInfo(
    password: string,
    userInfo?: { name?: string; email?: string }
  ): boolean {
    if (!userInfo) return false;

    const personalInfo = [
      userInfo.name?.toLowerCase(),
      userInfo.email?.split('@')[0].toLowerCase(),
    ].filter(Boolean);

    return personalInfo.some((info) => password.toLowerCase().includes(info));
  }

  /**
   * Gets permissions for a role
   */
  private getPermissionsForRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      guest: ['read:public'],
      user: [
        'read:profile',
        'update:profile',
        'read:analytics',
        'read:reports',
      ],
      admin: [
        'read:profile',
        'update:profile',
        'read:analytics',
        'read:reports',
        'read:users',
        'create:users',
        'update:users',
        'delete:users',
        'manage:system',
        'access:admin',
      ],
    };

    return rolePermissions[role] || [];
  }
}
