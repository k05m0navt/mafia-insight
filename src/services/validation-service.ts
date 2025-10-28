/**
 * Validation Service
 *
 * Provides comprehensive validation tracking and metrics for the import process.
 * Tracks validation rates, errors by entity type, and ensures ≥98% validation threshold.
 */

export interface ValidationError {
  entity: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

export interface ValidationMetrics {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  validationRate: number; // Percentage
  errorsByEntity: Record<string, number>;
}

export interface ValidationSummary {
  validationRate: number;
  meetsThreshold: boolean; // ≥98%
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errorsByEntity: Record<string, number>;
}

/**
 * Tracks validation metrics during import operations.
 * Provides detailed error tracking and validation rate calculations.
 */
export class ValidationMetricsTracker {
  private validRecords: number = 0;
  private invalidRecords: number = 0;
  private errorsByEntity: Map<string, number> = new Map();
  private validByEntity: Map<string, number> = new Map();
  private errors: ValidationError[] = [];
  private readonly maxStoredErrors = 100; // Limit to prevent memory issues
  private readonly validationThreshold = 98; // 98% threshold

  /**
   * Record a successfully validated record.
   */
  recordValid(entity: string): void {
    this.validRecords++;
    this.validByEntity.set(entity, (this.validByEntity.get(entity) || 0) + 1);
  }

  /**
   * Record an invalid record with error details.
   */
  recordInvalid(
    entity: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.invalidRecords++;
    this.errorsByEntity.set(entity, (this.errorsByEntity.get(entity) || 0) + 1);

    // Store error details (with limit to prevent memory issues)
    if (this.errors.length < this.maxStoredErrors) {
      this.errors.push({
        entity,
        message,
        context,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get current validation metrics.
   */
  getMetrics(): ValidationMetrics {
    const totalRecords = this.validRecords + this.invalidRecords;
    const validationRate =
      totalRecords > 0
        ? Math.round((this.validRecords / totalRecords) * 100)
        : 0;

    return {
      totalRecords,
      validRecords: this.validRecords,
      invalidRecords: this.invalidRecords,
      validationRate,
      errorsByEntity: Object.fromEntries(this.errorsByEntity),
    };
  }

  /**
   * Get all stored validation errors.
   */
  getErrors(): ValidationError[] {
    return [...this.errors];
  }

  /**
   * Get validation rate for a specific entity type.
   */
  getValidationRateByEntity(entity: string): number {
    const valid = this.validByEntity.get(entity) || 0;
    const invalid = this.errorsByEntity.get(entity) || 0;
    const total = valid + invalid;

    if (total === 0) return 0;

    return Math.round((valid / total) * 100 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get summary with threshold check.
   */
  getSummary(): ValidationSummary {
    const metrics = this.getMetrics();

    return {
      validationRate: metrics.validationRate,
      meetsThreshold: metrics.validationRate >= this.validationThreshold,
      totalRecords: metrics.totalRecords,
      validRecords: metrics.validRecords,
      invalidRecords: metrics.invalidRecords,
      errorsByEntity: metrics.errorsByEntity,
    };
  }

  /**
   * Reset all metrics and errors.
   */
  reset(): void {
    this.validRecords = 0;
    this.invalidRecords = 0;
    this.errorsByEntity.clear();
    this.validByEntity.clear();
    this.errors = [];
  }
}
