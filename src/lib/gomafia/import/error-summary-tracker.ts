import { ImportPhase } from './import-orchestrator';
import { ErrorCategory } from './retry-manager';

/**
 * Error summary data structure
 */
export interface ErrorSummary {
  totalErrors: number;
  errorsByCategory: {
    transient: number;
    permanent: number;
  };
  errorsByType: Record<string, number>;
  skippedEntitiesByPhase: Record<string, number>;
  recentErrors: Array<{
    code: string;
    message: string;
    phase: ImportPhase;
    category: ErrorCategory;
    type: string;
    entityId?: string;
    entityType?: string;
    timestamp: string;
    stackTrace?: string;
  }>;
}

/**
 * Tracks error summaries during import operations.
 * Integrates with SyncLog.errors JSON field alongside validation metrics.
 */
export class ErrorSummaryTracker {
  private errors: Array<{
    code: string;
    message: string;
    phase: ImportPhase;
    category: ErrorCategory;
    type: string;
    entityId?: string;
    entityType?: string;
    timestamp: Date;
    stackTrace?: string;
  }> = [];

  private skippedEntitiesByPhase: Map<ImportPhase, number> = new Map();

  /**
   * Record an error in the summary.
   */
  recordError(
    error: Error,
    phase: ImportPhase,
    category: ErrorCategory,
    code: string,
    type: string,
    context?: {
      entityId?: string;
      entityType?: string;
    }
  ): void {
    this.errors.push({
      code,
      message: error.message,
      phase,
      category,
      type,
      entityId: context?.entityId,
      entityType: context?.entityType,
      timestamp: new Date(),
      stackTrace: error.stack,
    });
  }

  /**
   * Record a skipped entity for a phase.
   */
  recordSkippedEntity(phase: ImportPhase): void {
    const current = this.skippedEntitiesByPhase.get(phase) || 0;
    this.skippedEntitiesByPhase.set(phase, current + 1);
  }

  /**
   * Get current error summary.
   */
  getSummary(): ErrorSummary {
    const errorsByCategory = {
      transient: 0,
      permanent: 0,
    };

    const errorsByType: Record<string, number> = {};

    for (const error of this.errors) {
      if (error.category === ErrorCategory.TRANSIENT) {
        errorsByCategory.transient++;
      } else {
        errorsByCategory.permanent++;
      }

      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    }

    const skippedEntitiesByPhase: Record<string, number> = {};
    for (const [phase, count] of this.skippedEntitiesByPhase.entries()) {
      skippedEntitiesByPhase[phase] = count;
    }

    // Get recent errors (last 50)
    const recentErrors = this.errors.slice(-50).map((error) => ({
      code: error.code,
      message: error.message,
      phase: error.phase,
      category: error.category,
      type: error.type,
      entityId: error.entityId,
      entityType: error.entityType,
      timestamp: error.timestamp.toISOString(),
      stackTrace: error.stackTrace,
    }));

    return {
      totalErrors: this.errors.length,
      errorsByCategory,
      errorsByType,
      skippedEntitiesByPhase,
      recentErrors,
    };
  }

  /**
   * Generate error summary message.
   * Format: "Import completed with X errors. Y entities skipped."
   */
  getSummaryMessage(): string {
    const summary = this.getSummary();
    const totalSkipped = Object.values(summary.skippedEntitiesByPhase).reduce(
      (sum, count) => sum + count,
      0
    );

    if (summary.totalErrors === 0 && totalSkipped === 0) {
      return 'Import completed successfully with no errors.';
    }

    return `Import completed with ${summary.totalErrors} error${
      summary.totalErrors !== 1 ? 's' : ''
    }. ${totalSkipped} entit${totalSkipped !== 1 ? 'ies' : 'y'} skipped.`;
  }

  /**
   * Reset all tracked errors and skipped entities.
   */
  reset(): void {
    this.errors = [];
    this.skippedEntitiesByPhase.clear();
  }

  /**
   * Get all errors (for detailed logging).
   */
  getAllErrors(): Array<{
    code: string;
    message: string;
    phase: ImportPhase;
    category: ErrorCategory;
    type: string;
    entityId?: string;
    entityType?: string;
    timestamp: Date;
    stackTrace?: string;
  }> {
    return [...this.errors];
  }
}
