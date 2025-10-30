export class TestValidationSuite {
  private validations: Map<string, ValidationRule>;

  constructor() {
    this.validations = new Map();
  }

  /**
   * Register a validation rule
   */
  registerRule(name: string, rule: ValidationRule): void {
    this.validations.set(name, rule);
  }

  /**
   * Validate against all rules
   */
  validate(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [name, rule] of this.validations.entries()) {
      try {
        if (!rule.validate(data)) {
          errors.push({
            rule: name,
            message: rule.message || 'Validation failed',
          });
        }
      } catch (error) {
        errors.push({
          rule: name,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate against specific rule
   */
  validateRule(name: string, data: unknown): ValidationResult {
    const rule = this.validations.get(name);
    if (!rule) {
      throw new Error(`Validation rule not found: ${name}`);
    }

    try {
      const valid = rule.validate(data);
      return {
        valid,
        errors: valid
          ? []
          : [
              {
                rule: name,
                message: rule.message || 'Validation failed',
              },
            ],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            rule: name,
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      };
    }
  }

  /**
   * Remove validation rule
   */
  removeRule(name: string): boolean {
    return this.validations.delete(name);
  }

  /**
   * Clear all validation rules
   */
  clearRules(): void {
    this.validations.clear();
  }

  /**
   * List all registered rules
   */
  listRules(): string[] {
    return Array.from(this.validations.keys());
  }
}

export interface ValidationRule {
  validate: (data: unknown) => boolean;
  message?: string;
}

export interface ValidationError {
  rule: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
