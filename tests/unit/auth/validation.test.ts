import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateRegistrationData,
  emailSchema,
  passwordSchema,
  registrationSchema,
} from '@/lib/auth/validation';

describe('Email Validation (RFC 5322)', () => {
  describe('validateEmail', () => {
    it('should accept valid standard email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.com',
        'user_name@example-domain.com',
        'user123@test123.example.com',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should accept emails with plus signs', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept emails with dots', () => {
      const result = validateEmail('first.last@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept emails with hyphens', () => {
      const result = validateEmail('user-name@example-domain.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject emails missing @ symbol', () => {
      const result = validateEmail('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject emails with invalid domain', () => {
      const invalidEmails = [
        'user@',
        'user@domain',
        '@example.com',
        'user@.com',
        'user@domain..com',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject emails with spaces', () => {
      const result = validateEmail('user name@example.com');
      expect(result.isValid).toBe(false);
    });
  });

  describe('emailSchema (Zod)', () => {
    it('should parse valid emails', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid emails with proper error messages', () => {
      const invalidEmails = [
        { email: '', expectedError: 'Email is required' },
        { email: 'invalid', expectedError: 'Invalid email format' },
        { email: 'user@', expectedError: 'Invalid email format' },
      ];

      invalidEmails.forEach(({ email, expectedError }) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain(expectedError);
        }
      });
    });
  });
});

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should accept valid passwords meeting all requirements', () => {
      const validPasswords = [
        'Password123!',
        'MyP@ssw0rd',
        'Str0ng#Pass',
        'Test1234$',
      ];

      validPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      );
    });

    it('should return multiple errors for passwords missing multiple requirements', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('passwordSchema (Zod)', () => {
    it('should parse valid passwords', () => {
      const validPasswords = ['Password123!', 'MyP@ssw0rd', 'Str0ng#Pass'];

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid passwords with proper error messages', () => {
      const testCases = [
        {
          password: 'short',
          expectedError: 'at least 8 characters',
        },
        {
          password: 'nouppercase123!',
          expectedError: 'uppercase letter',
        },
        {
          password: 'NONUMBERS!',
          expectedError: 'number',
        },
        {
          password: 'NoSpecial123',
          expectedError: 'special character',
        },
      ];

      testCases.forEach(({ password, expectedError }) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain(expectedError);
        }
      });
    });
  });
});

describe('Registration Data Validation', () => {
  describe('validateRegistrationData', () => {
    it('should accept valid registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        name: 'John Doe',
      };

      const result = validateRegistrationData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should reject when passwords do not match', () => {
      const data = {
        email: 'user@example.com',
        password: 'Password123!',
        confirmPassword: 'Different123!',
        name: 'John Doe',
      };

      const result = validateRegistrationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.confirmPassword).toBe('Passwords do not match');
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        name: 'John Doe',
      };

      const result = validateRegistrationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should reject invalid password', () => {
      const data = {
        email: 'user@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        name: 'John Doe',
      };

      const result = validateRegistrationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it('should reject name that is too short', () => {
      const data = {
        email: 'user@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        name: 'A',
      };

      const result = validateRegistrationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should reject name that is too long', () => {
      const data = {
        email: 'user@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        name: 'A'.repeat(101),
      };

      const result = validateRegistrationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const data = {
        email: 'invalid',
        password: 'weak',
        confirmPassword: 'different',
        name: 'A',
      };

      const result = validateRegistrationData(data);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });
  });

  describe('registrationSchema (Zod)', () => {
    it('should parse valid registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        name: 'John Doe',
      };

      const result = registrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when confirmPassword does not match password', () => {
      const data = {
        email: 'user@example.com',
        password: 'Password123!',
        confirmPassword: 'Different123!',
        name: 'John Doe',
      };

      const result = registrationSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          (e) => e.path[0] === 'confirmPassword'
        );
        expect(confirmPasswordError).toBeDefined();
        expect(confirmPasswordError?.message).toBe('Passwords do not match');
      }
    });
  });
});

describe('Real-time Validation Feedback', () => {
  it('should provide immediate feedback for email validation', () => {
    // Test that validation can be called repeatedly for real-time feedback
    const email = 'user@example.com';
    const result1 = validateEmail(email);
    const result2 = validateEmail(email);

    expect(result1.isValid).toBe(true);
    expect(result2.isValid).toBe(true);
    expect(result1).toEqual(result2);
  });

  it('should provide immediate feedback for password validation', () => {
    // Test that validation can be called repeatedly for real-time feedback
    const password = 'Password123!';
    const result1 = validatePassword(password);
    const result2 = validatePassword(password);

    expect(result1.isValid).toBe(true);
    expect(result2.isValid).toBe(true);
    expect(result1.errors).toEqual(result2.errors);
  });
});
