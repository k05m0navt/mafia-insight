// Mock implementation of validation functions for testing
export const validation = {
  // Mock email validation
  validateEmail: jest.fn().mockImplementation((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      error: emailRegex.test(email) ? null : 'Invalid email format',
    };
  }),

  // Mock password validation
  validatePassword: jest.fn().mockImplementation((password: string) => {
    const errors = [];
    
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
  }),

  // Mock name validation
  validateName: jest.fn().mockImplementation((name: string) => {
    const errors = [];
    
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
  }),

  // Mock login credentials validation
  validateLoginCredentials: jest.fn().mockImplementation((credentials: {
    email: string;
    password: string;
  }) => {
    const errors: Record<string, string> = {};
    
    const emailValidation = validation.validateEmail(credentials.email);
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
  }),

  // Mock registration data validation
  validateRegistrationData: jest.fn().mockImplementation((userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) => {
    const errors: Record<string, string> = {};
    
    const emailValidation = validation.validateEmail(userData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error || 'Invalid email';
    }
    
    const passwordValidation = validation.validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors.join(', ');
    }
    
    const nameValidation = validation.validateName(userData.name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.errors.join(', ');
    }
    
    if (userData.role && !['admin', 'user', 'moderator'].includes(userData.role)) {
      errors.role = 'Invalid role';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }),

  // Mock form validation
  validateForm: jest.fn().mockImplementation((formData: Record<string, any>, rules: Record<string, any>) => {
    const errors: Record<string, string> = {};
    
    Object.keys(rules).forEach((field) => {
      const value = formData[field];
      const rule = rules[field];
      
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = rule.message || `${field} is required`;
      } else if (value && rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message || `${field} format is invalid`;
      } else if (value && rule.minLength && value.length < rule.minLength) {
        errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`;
      } else if (value && rule.maxLength && value.length > rule.maxLength) {
        errors[field] = rule.message || `${field} must be less than ${rule.maxLength} characters`;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }),

  // Mock game data validation
  validateGameData: jest.fn().mockImplementation((gameData: any) => {
    const errors: string[] = [];
    
    if (!gameData.name || gameData.name.trim().length === 0) {
      errors.push('Game name is required');
    }
    
    if (gameData.status && !['active', 'completed', 'cancelled'].includes(gameData.status)) {
      errors.push('Invalid game status');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }),

  // Mock player data validation
  validatePlayerData: jest.fn().mockImplementation((playerData: any) => {
    const errors: string[] = [];
    
    if (!playerData.name || playerData.name.trim().length === 0) {
      errors.push('Player name is required');
    }
    
    if (!playerData.gameId) {
      errors.push('Game ID is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }),

  // Mock sanitization functions
  sanitizeString: jest.fn().mockImplementation((str: string) => {
    return str.trim().replace(/[<>]/g, '');
  }),

  sanitizeEmail: jest.fn().mockImplementation((email: string) => {
    return email.trim().toLowerCase();
  }),

  sanitizeName: jest.fn().mockImplementation((name: string) => {
    return name.trim().replace(/[^a-zA-Z\s]/g, '');
  }),

  // Mock validation rules
  rules: {
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
  },

  // Reset all mocks
  resetMocks: () => {
    Object.values(validation).forEach((fn) => {
      if (typeof fn === 'function' && 'mockReset' in fn) {
        fn.mockReset();
      }
    });
  },
};

export default validation;
