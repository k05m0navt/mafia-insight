// Validation functions for authentication and forms
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user' | 'moderator';
}

export interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  message?: string;
}

export interface GameData {
  name?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PlayerData {
  name?: string;
  gameId?: string;
  [key: string]: unknown;
}

// Email validation
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    isValid: emailRegex.test(email),
    error: emailRegex.test(email) ? undefined : 'Invalid email format',
  };
}

// Password validation
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!/[A-Za-z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Name validation
export function validateName(name: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.trim().length > 50) {
    errors.push('Name must be less than 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Login credentials validation
export function validateLoginCredentials(
  credentials: LoginCredentials
): ValidationResult {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(credentials.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error || 'Invalid email';
  }

  if (!credentials.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Registration data validation
export function validateRegistrationData(
  userData: RegisterData
): ValidationResult {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error || 'Invalid email';
  }

  const passwordValidation = validatePassword(userData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors.join(', ');
  }

  const nameValidation = validateName(userData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.errors.join(', ');
  }

  if (
    userData.role &&
    !['admin', 'user', 'moderator'].includes(userData.role)
  ) {
    errors.role = 'Invalid role';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Signup credentials validation (alias for registration)
export function validateSignupCredentials(
  userData: RegisterData
): ValidationResult {
  return validateRegistrationData(userData);
}

// Form validation with rules
export function validateForm(
  formData: Record<string, unknown>,
  rules: Record<string, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const value = formData[field];
    const rule = rules[field];
    const valueStr = value?.toString() ?? '';

    if (rule.required && (!value || valueStr.trim() === '')) {
      errors[field] = rule.message || `${field} is required`;
    } else if (
      value &&
      rule.pattern &&
      typeof value === 'string' &&
      !rule.pattern.test(value)
    ) {
      errors[field] = rule.message || `${field} format is invalid`;
    } else if (
      value &&
      rule.minLength &&
      typeof value === 'string' &&
      value.length < rule.minLength
    ) {
      errors[field] =
        rule.message ||
        `${field} must be at least ${rule.minLength} characters`;
    } else if (
      value &&
      rule.maxLength &&
      typeof value === 'string' &&
      value.length > rule.maxLength
    ) {
      errors[field] =
        rule.message ||
        `${field} must be less than ${rule.maxLength} characters`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Game data validation
export function validateGameData(gameData: GameData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const name = typeof gameData.name === 'string' ? gameData.name : '';
  if (!name || name.trim().length === 0) {
    errors.push('Game name is required');
  }

  const status = typeof gameData.status === 'string' ? gameData.status : '';
  if (status && !['active', 'completed', 'cancelled'].includes(status)) {
    errors.push('Invalid game status');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Player data validation
export function validatePlayerData(playerData: PlayerData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const name = typeof playerData.name === 'string' ? playerData.name : '';
  if (!name || name.trim().length === 0) {
    errors.push('Player name is required');
  }

  if (
    !playerData.gameId ||
    (typeof playerData.gameId !== 'string' &&
      typeof playerData.gameId !== 'number')
  ) {
    errors.push('Game ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Sanitization functions
export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizeName(name: string): string {
  return name.trim().replace(/[^a-zA-Z\s]/g, '');
}

// Validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format',
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Password must be at least 6 characters',
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Name must be between 2 and 50 characters',
  },
};

export default {
  validateEmail,
  validatePassword,
  validateName,
  validateLoginCredentials,
  validateRegistrationData,
  validateSignupCredentials,
  validateForm,
  validateGameData,
  validatePlayerData,
  sanitizeString,
  sanitizeEmail,
  sanitizeName,
  validationRules,
};
