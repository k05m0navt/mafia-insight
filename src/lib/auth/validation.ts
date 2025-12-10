import { z } from 'zod';

/**
 * RFC 5322 compliant email regex pattern
 * This pattern validates email addresses according to RFC 5322 specification
 * which allows for complex email formats including quoted strings, comments, etc.
 *
 * Note: Full RFC 5322 compliance is extremely complex. This pattern covers
 * the most common valid email formats while being practical for production use.
 */
const RFC_5322_EMAIL_REGEX =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/**
 * Email validation schema using RFC 5322 standard
 * Uses Zod with custom refine to enforce RFC 5322 compliance
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .refine((email) => RFC_5322_EMAIL_REGEX.test(email), {
    message: 'Email must be in a valid format (RFC 5322 standard)',
  });

/**
 * Password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

/**
 * Registration form validation schema
 */
export const registrationSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Type inference from registration schema
 */
export type RegistrationFormData = z.infer<typeof registrationSchema>;

/**
 * Validate email using RFC 5322 standard
 * @param email - Email address to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.issues[0]?.message || 'Invalid email format',
      };
    }
    return { isValid: false, error: 'Invalid email format' };
  }
}

/**
 * Validate password against requirements
 * @param password - Password to validate
 * @returns Validation result with isValid flag and array of error messages
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  try {
    passwordSchema.parse(password);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map((e) => e.message),
      };
    }
    return { isValid: false, errors: ['Invalid password format'] };
  }
}

/**
 * Validate registration form data
 * @param data - Registration form data
 * @returns Validation result with isValid flag and errors object
 */
export function validateRegistrationData(data: {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  try {
    registrationSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return {
      isValid: false,
      errors: { general: 'Validation failed' },
    };
  }
}
