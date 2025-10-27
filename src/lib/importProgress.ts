import { ImportProgress, _ImportStatus } from '@/types/importProgress';

/**
 * Import progress state management utilities
 */
export class ImportProgressManager {
  private static instance: ImportProgressManager;
  private progress: ImportProgress | null = null;

  static getInstance(): ImportProgressManager {
    if (!ImportProgressManager.instance) {
      ImportProgressManager.instance = new ImportProgressManager();
    }
    return ImportProgressManager.instance;
  }

  /**
   * Start a new import operation
   */
  startImport(operation: string, totalRecords: number): ImportProgress {
    this.progress = {
      id: `import_${Date.now()}`,
      operation,
      progress: 0,
      totalRecords,
      processedRecords: 0,
      errors: 0,
      startTime: new Date(),
      status: 'RUNNING',
    };
    return this.progress;
  }

  /**
   * Update progress
   */
  updateProgress(
    processedRecords: number,
    errors: number = 0
  ): ImportProgress | null {
    if (!this.progress) return null;

    this.progress.processedRecords = processedRecords;
    this.progress.errors = errors;
    this.progress.progress = Math.round(
      (processedRecords / this.progress.totalRecords) * 100
    );

    // Estimate completion time
    if (processedRecords > 0) {
      const elapsed = Date.now() - this.progress.startTime.getTime();
      const rate = processedRecords / elapsed;
      const remaining = this.progress.totalRecords - processedRecords;
      const estimatedMs = remaining / rate;
      this.progress.estimatedCompletion = new Date(Date.now() + estimatedMs);
    }

    return this.progress;
  }

  /**
   * Complete the import
   */
  completeImport(): ImportProgress | null {
    if (!this.progress) return null;

    this.progress.status = 'COMPLETED';
    this.progress.progress = 100;
    this.progress.estimatedCompletion = new Date();

    return this.progress;
  }

  /**
   * Fail the import
   */
  failImport(_error: string): ImportProgress | null {
    if (!this.progress) return null;

    this.progress.status = 'FAILED';
    this.progress.estimatedCompletion = new Date();

    return this.progress;
  }

  /**
   * Cancel the import
   */
  cancelImport(): ImportProgress | null {
    if (!this.progress) return null;

    this.progress.status = 'CANCELLED';
    this.progress.estimatedCompletion = new Date();

    return this.progress;
  }

  /**
   * Get current progress
   */
  getCurrentProgress(): ImportProgress | null {
    return this.progress;
  }

  /**
   * Clear progress
   */
  clearProgress(): void {
    this.progress = null;
  }
}

/**
 * Get the singleton instance
 */
export const importProgressManager = ImportProgressManager.getInstance();
