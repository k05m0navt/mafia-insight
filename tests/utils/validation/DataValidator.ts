export interface ValidationRule {
  field: string;
  type:
    | 'required'
    | 'email'
    | 'url'
    | 'number'
    | 'string'
    | 'boolean'
    | 'date'
    | 'array'
    | 'object'
    | 'custom';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: unknown) => boolean;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
  rule: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: unknown;
  suggestion?: string;
}

export class DataValidator {
  private rules: Map<string, ValidationRule[]> = new Map();

  addValidationRules(dataType: string, rules: ValidationRule[]): void {
    this.rules.set(dataType, rules);
  }

  validate(data: unknown, dataType: string): ValidationResult {
    const rules = this.rules.get(dataType) || [];
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field);
      const validationResult = this.validateField(value, rule);

      if (!validationResult.isValid) {
        errors.push(...validationResult.errors);
      }

      if (validationResult.warnings.length > 0) {
        warnings.push(...validationResult.warnings);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateField(value: unknown, rule: ValidationRule): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required validation
    if (
      rule.type === 'required' &&
      (value === null || value === undefined || value === '')
    ) {
      errors.push({
        field: rule.field,
        message: rule.message || `${rule.field} is required`,
        value,
        rule: 'required',
      });
      return { isValid: false, errors, warnings };
    }

    // Skip other validations if value is empty and not required
    if (value === null || value === undefined || value === '') {
      return { isValid: true, errors, warnings };
    }

    // Type validations
    switch (rule.type) {
      case 'email':
        if (!this.isValidEmail(value)) {
          errors.push({
            field: rule.field,
            message:
              rule.message || `${rule.field} must be a valid email address`,
            value,
            rule: 'email',
          });
        }
        break;

      case 'url':
        if (!this.isValidUrl(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be a valid URL`,
            value,
            rule: 'url',
          });
        }
        break;

      case 'number':
        if (!this.isValidNumber(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be a valid number`,
            value,
            rule: 'number',
          });
        } else {
          // Range validations for numbers
          if (rule.min !== undefined && value < rule.min) {
            errors.push({
              field: rule.field,
              message:
                rule.message || `${rule.field} must be at least ${rule.min}`,
              value,
              rule: 'min',
            });
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push({
              field: rule.field,
              message:
                rule.message || `${rule.field} must be at most ${rule.max}`,
              value,
              rule: 'max',
            });
          }
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be a string`,
            value,
            rule: 'string',
          });
        } else {
          // Length validations for strings
          if (rule.minLength !== undefined && value.length < rule.minLength) {
            errors.push({
              field: rule.field,
              message:
                rule.message ||
                `${rule.field} must be at least ${rule.minLength} characters long`,
              value,
              rule: 'minLength',
            });
          }
          if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            errors.push({
              field: rule.field,
              message:
                rule.message ||
                `${rule.field} must be at most ${rule.maxLength} characters long`,
              value,
              rule: 'maxLength',
            });
          }
          // Pattern validation
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push({
              field: rule.field,
              message:
                rule.message ||
                `${rule.field} does not match the required pattern`,
              value,
              rule: 'pattern',
            });
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be a boolean`,
            value,
            rule: 'boolean',
          });
        }
        break;

      case 'date':
        if (!this.isValidDate(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be a valid date`,
            value,
            rule: 'date',
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be an array`,
            value,
            rule: 'array',
          });
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} must be an object`,
            value,
            rule: 'object',
          });
        }
        break;

      case 'custom':
        if (rule.customValidator && !rule.customValidator(value)) {
          errors.push({
            field: rule.field,
            message: rule.message || `${rule.field} failed custom validation`,
            value,
            rule: 'custom',
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateArray(data: unknown[], dataType: string): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    let isValid = true;

    for (let i = 0; i < data.length; i++) {
      const itemResult = this.validate(data[i], dataType);

      if (!itemResult.isValid) {
        isValid = false;
        // Add index to field names for array validation
        const indexedErrors = itemResult.errors.map((error) => ({
          ...error,
          field: `[${i}].${error.field}`,
        }));
        allErrors.push(...indexedErrors);
      }

      allWarnings.push(
        ...itemResult.warnings.map((warning) => ({
          ...warning,
          field: `[${i}].${warning.field}`,
        }))
      );
    }

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  private isValidDate(value: unknown): boolean {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  }

  // Predefined validation rules for common data types
  static getUserValidationRules(): ValidationRule[] {
    return [
      {
        field: 'id',
        type: 'required',
        message: 'User ID is required',
      },
      {
        field: 'email',
        type: 'email',
        message: 'Valid email address is required',
      },
      {
        field: 'name',
        type: 'string',
        minLength: 1,
        maxLength: 100,
        message: 'Name must be between 1 and 100 characters',
      },
      {
        field: 'role',
        type: 'string',
        pattern: /^(USER|ADMIN|GUEST)$/,
        message: 'Role must be USER, ADMIN, or GUEST',
      },
      {
        field: 'createdAt',
        type: 'date',
        message: 'Created date must be valid',
      },
      {
        field: 'updatedAt',
        type: 'date',
        message: 'Updated date must be valid',
      },
    ];
  }

  static getPlayerValidationRules(): ValidationRule[] {
    return [
      {
        field: 'id',
        type: 'required',
        message: 'Player ID is required',
      },
      {
        field: 'name',
        type: 'string',
        minLength: 1,
        maxLength: 100,
        message: 'Player name must be between 1 and 100 characters',
      },
      {
        field: 'rating',
        type: 'number',
        min: 0,
        max: 3000,
        message: 'Rating must be between 0 and 3000',
      },
      {
        field: 'gamesPlayed',
        type: 'number',
        min: 0,
        message: 'Games played must be non-negative',
      },
    ];
  }

  static getClubValidationRules(): ValidationRule[] {
    return [
      {
        field: 'id',
        type: 'required',
        message: 'Club ID is required',
      },
      {
        field: 'name',
        type: 'string',
        minLength: 1,
        maxLength: 200,
        message: 'Club name must be between 1 and 200 characters',
      },
      {
        field: 'city',
        type: 'string',
        minLength: 1,
        maxLength: 100,
        message: 'City must be between 1 and 100 characters',
      },
      {
        field: 'country',
        type: 'string',
        minLength: 1,
        maxLength: 100,
        message: 'Country must be between 1 and 100 characters',
      },
    ];
  }

  static getTournamentValidationRules(): ValidationRule[] {
    return [
      {
        field: 'id',
        type: 'required',
        message: 'Tournament ID is required',
      },
      {
        field: 'name',
        type: 'string',
        minLength: 1,
        maxLength: 200,
        message: 'Tournament name must be between 1 and 200 characters',
      },
      {
        field: 'startDate',
        type: 'date',
        message: 'Start date must be valid',
      },
      {
        field: 'endDate',
        type: 'date',
        message: 'End date must be valid',
      },
      {
        field: 'location',
        type: 'string',
        minLength: 1,
        maxLength: 200,
        message: 'Location must be between 1 and 200 characters',
      },
    ];
  }
}
