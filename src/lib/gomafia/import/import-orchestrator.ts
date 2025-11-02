import { PrismaClient, Prisma } from '@prisma/client';
import { Browser } from 'playwright';
import { CheckpointManager, ImportCheckpoint } from './checkpoint-manager';
import { AdvisoryLockManager } from './advisory-lock';
import { RateLimiter } from './rate-limiter';
import { BatchProcessor } from './batch-processor';
import { TimeoutManager } from './timeout-manager';
import { ValidationMetricsTracker } from '@/services/validation-service';
import { IntegrityChecker } from './integrity-checker';
import { playerSchema } from '../validators/player-schema';
import { clubSchema } from '../validators/club-schema';
import { tournamentSchema } from '../validators/tournament-schema';
import { gameSchema } from '../validators/game-schema';
import { resilientDB } from '@/lib/db-resilient';

type ImportPhase =
  | 'CLUBS'
  | 'PLAYERS'
  | 'PLAYER_YEAR_STATS'
  | 'TOURNAMENTS'
  | 'PLAYER_TOURNAMENT_HISTORY'
  | 'GAMES'
  | 'STATISTICS';

interface ValidationMetrics {
  totalFetched: number;
  validRecords: number;
  invalidRecords: number;
  duplicatesSkipped: number;
  validationRate: number;
}

/**
 * Structured error log entry for tracking failures during import.
 * Inspired by NodeKit's AppError pattern with code, details, and debug fields.
 */
interface ImportErrorLog {
  /** Error classification code (e.g., 'EC-001', 'SCRAPE_FAILED') */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Import phase where error occurred */
  phase: ImportPhase;
  /** Batch number or entity identifier (for traceability) */
  context?: {
    batchIndex?: number;
    entityId?: string;
    entityType?: string;
    operation?: string;
  };
  /** Original error object (for debugging) */
  error?: Error;
  /** Timestamp when error was logged */
  timestamp: Date;
  /** Whether the operation will be retried */
  willRetry?: boolean;
}

/**
 * Import orchestrator that coordinates all 7 phases of the gomafia.pro import.
 * Manages checkpoints, validation, batch processing, progress tracking, and timeout enforcement.
 *
 * Features:
 * - Automatic timeout after 12 hours (configurable)
 * - Checkpoint-based resume capability
 * - Retry logic for transient failures
 * - Validation and integrity checking
 */
export class ImportOrchestrator {
  private checkpointManager: CheckpointManager;
  private lockManager: AdvisoryLockManager;
  private rateLimiter: RateLimiter;
  private batchProcessor: BatchProcessor<unknown>;
  private timeoutManager: TimeoutManager;
  private validationMetrics: ValidationMetrics;
  private validationTracker: ValidationMetricsTracker;
  private currentSyncLogId: string | null = null;
  private errorLogs: ImportErrorLog[] = [];
  private currentPhase: ImportPhase | null = null;
  private processedIds: Set<string> = new Set(); // For duplicate prevention (T116)
  private cancellationSignal: AbortSignal | null = null; // For graceful cancellation (T118)
  private skippedPagesByPhase: Map<ImportPhase, number[]> = new Map(); // Track skipped pages by phase

  private readonly phases: ImportPhase[] = [
    'CLUBS',
    'PLAYERS',
    'PLAYER_YEAR_STATS',
    'TOURNAMENTS',
    'PLAYER_TOURNAMENT_HISTORY',
    'GAMES',
    'STATISTICS',
  ];

  constructor(
    private db: PrismaClient,
    private browser: Browser,
    maxDurationMs: number = 12 * 60 * 60 * 1000 // Default: 12 hours
  ) {
    this.checkpointManager = new CheckpointManager(db);
    this.lockManager = new AdvisoryLockManager(db);
    this.rateLimiter = new RateLimiter(2000); // 2 seconds between requests
    this.batchProcessor = new BatchProcessor(db, 100); // 100 records per batch
    this.timeoutManager = new TimeoutManager(maxDurationMs);
    this.validationTracker = new ValidationMetricsTracker();
    this.validationMetrics = {
      totalFetched: 0,
      validRecords: 0,
      invalidRecords: 0,
      duplicatesSkipped: 0,
      validationRate: 0,
    };
  }

  /**
   * Start the import process.
   * Acquires advisory lock and begins orchestration.
   */
  async start(): Promise<string> {
    // Create sync log
    const syncLog = await resilientDB.execute((db) =>
      db.syncLog.create({
        data: {
          type: 'FULL',
          status: 'RUNNING',
          startTime: new Date(),
        },
      })
    );

    this.currentSyncLogId = syncLog.id;

    // Start timeout timer
    this.timeoutManager.start();
    console.log(
      `Import started with ${this.timeoutManager.getSummary().maxDuration / 1000 / 60 / 60}h timeout`
    );

    // Mark as running
    await resilientDB.execute((db) =>
      db.syncStatus.upsert({
        where: { id: 'current' },
        update: {
          isRunning: true,
          progress: 0,
          currentOperation: 'Starting import...',
          lastError: null,
        },
        create: {
          id: 'current',
          isRunning: true,
          progress: 0,
          currentOperation: 'Starting import...',
        },
      })
    );

    return syncLog.id;
  }

  /**
   * Save checkpoint during import.
   * Includes current processedIds for duplicate prevention on resume.
   */
  async saveCheckpoint(checkpoint: ImportCheckpoint): Promise<void> {
    await this.checkpointManager.saveCheckpoint(checkpoint);
  }

  /**
   * Load checkpoint for resume.
   * Restores processedIds Set for duplicate prevention.
   */
  async loadCheckpoint(): Promise<ImportCheckpoint | null> {
    const checkpoint = await this.checkpointManager.loadCheckpoint();

    if (checkpoint) {
      // Restore processedIds Set from checkpoint (T114)
      this.processedIds = new Set(checkpoint.processedIds);
      console.log(
        `Loaded checkpoint: ${checkpoint.currentPhase} phase, batch ${checkpoint.currentBatch}, ${checkpoint.processedIds.length} entities processed`
      );
    }

    return checkpoint;
  }

  /**
   * Check if an entity was already processed (duplicate prevention).
   * Inspired by Sidekiq Iteration's cursor-based duplicate prevention.
   *
   * @param entityId The entity ID to check
   * @returns True if entity was already processed
   */
  wasEntityProcessed(entityId: string): boolean {
    return this.processedIds.has(entityId);
  }

  /**
   * Mark an entity as processed.
   * Adds to the processedIds Set for duplicate prevention on resume.
   *
   * @param entityId The entity ID to mark as processed
   */
  markEntityProcessed(entityId: string): void {
    this.processedIds.add(entityId);
  }

  /**
   * Get all processed entity IDs.
   * Used when creating checkpoint for resume capability.
   *
   * @returns Array of all processed entity IDs
   */
  getProcessedIds(): string[] {
    return Array.from(this.processedIds);
  }

  /**
   * Clear processed IDs tracking.
   * Called when starting a fresh import (not resuming).
   */
  clearProcessedIds(): void {
    this.processedIds.clear();
  }

  /**
   * Get all import phases.
   */
  getPhases(): ImportPhase[] {
    return [...this.phases];
  }

  /**
   * Calculate overall progress based on current phase.
   */
  calculateProgress(currentPhaseIndex: number, totalPhases: number): number {
    return (currentPhaseIndex / totalPhases) * 100;
  }

  /**
   * Validate player data with Zod schema.
   */
  async validatePlayerData(data: unknown): Promise<boolean> {
    const result = playerSchema.safeParse(data);
    return result.success;
  }

  /**
   * Validate club data with Zod schema.
   */
  async validateClubData(data: unknown): Promise<boolean> {
    const result = clubSchema.safeParse(data);
    return result.success;
  }

  /**
   * Validate tournament data with Zod schema.
   */
  async validateTournamentData(data: unknown): Promise<boolean> {
    const result = tournamentSchema.safeParse(data);
    return result.success;
  }

  /**
   * Validate game data with Zod schema.
   */
  async validateGameData(data: unknown): Promise<boolean> {
    const result = gameSchema.safeParse(data);
    return result.success;
  }

  /**
   * Check if a record already exists (duplicate detection).
   */
  async checkDuplicate(
    entityType: 'Player' | 'Club' | 'Tournament' | 'Game',
    gomafiaId: string
  ): Promise<boolean> {
    try {
      switch (entityType) {
        case 'Player': {
          const player = await resilientDB.execute((db) =>
            db.player.findUnique({
              where: { gomafiaId },
            })
          );
          return !!player;
        }

        case 'Club': {
          const club = await resilientDB.execute((db) =>
            db.club.findUnique({ where: { gomafiaId } })
          );
          return !!club;
        }

        case 'Tournament': {
          const tournament = await resilientDB.execute((db) =>
            db.tournament.findUnique({
              where: { gomafiaId },
            })
          );
          return !!tournament;
        }

        case 'Game': {
          const game = await resilientDB.execute((db) =>
            db.game.findUnique({ where: { gomafiaId } })
          );
          return !!game;
        }

        default:
          return false;
      }
    } catch (error) {
      console.error(
        `Duplicate check failed for ${entityType} ${gomafiaId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get current validation metrics.
   */
  getValidationMetrics(): ValidationMetrics {
    const validationRate =
      this.validationMetrics.totalFetched > 0
        ? (this.validationMetrics.validRecords /
            this.validationMetrics.totalFetched) *
          100
        : 0;

    return {
      ...this.validationMetrics,
      validationRate,
    };
  }

  /**
   * Update validation metrics.
   */
  updateValidationMetrics(update: Partial<ValidationMetrics>): void {
    this.validationMetrics = {
      ...this.validationMetrics,
      ...update,
    };
  }

  /**
   * Record a valid record in metrics (convenience method for T091).
   */
  recordValidRecord(entity: string): void {
    this.validationMetrics.validRecords++;
    this.validationMetrics.totalFetched++;
    this.validationTracker.recordValid(entity);
  }

  /**
   * Record an invalid record in metrics (convenience method for T091).
   */
  recordInvalidRecord(
    entity: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.validationMetrics.invalidRecords++;
    this.validationMetrics.totalFetched++;
    this.validationTracker.recordInvalid(entity, message, context);
  }

  /**
   * Record a skipped duplicate in metrics (convenience method for T091).
   */
  recordDuplicateSkipped(): void {
    this.validationMetrics.duplicatesSkipped++;
  }

  /**
   * Get validation summary with threshold check (convenience method for T091).
   */
  getValidationSummary() {
    return this.validationTracker.getSummary();
  }

  /**
   * Record skipped pages for a phase.
   * @param phase The import phase
   * @param pages Array of skipped page numbers
   */
  recordSkippedPages(phase: ImportPhase, pages: number[]): void {
    const existing = this.skippedPagesByPhase.get(phase) || [];
    this.skippedPagesByPhase.set(phase, [...existing, ...pages]);
  }

  /**
   * Get all skipped pages by phase.
   * @returns Map of phase to skipped page numbers
   */
  getSkippedPages(): Map<ImportPhase, number[]> {
    return new Map(this.skippedPagesByPhase);
  }

  /**
   * Get skipped pages as a flat object for storage.
   */
  getSkippedPagesForStorage(): Record<string, number[]> {
    const result: Record<string, number[]> = {};
    for (const [phase, pages] of this.skippedPagesByPhase.entries()) {
      // Remove duplicates and sort
      const uniquePages = Array.from(new Set(pages)).sort((a, b) => a - b);
      if (uniquePages.length > 0) {
        result[phase] = uniquePages;
      }
    }
    return result;
  }

  /**
   * Reset validation metrics between imports (convenience method for T091).
   */
  resetValidationMetrics(): void {
    this.validationMetrics = {
      totalFetched: 0,
      validRecords: 0,
      invalidRecords: 0,
      duplicatesSkipped: 0,
      validationRate: 0,
    };
    this.validationTracker.reset();
  }

  /**
   * Complete the import process.
   */
  async complete(success: boolean): Promise<void> {
    if (!this.currentSyncLogId) {
      throw new Error('No sync log ID available');
    }

    const metrics = this.getValidationMetrics();
    const validationSummary = this.validationTracker.getSummary();
    const errorSummary = this.getErrorSummary();

    // Run integrity checks if import was successful
    let integrityResults = null;
    if (success) {
      const integrityChecker = new IntegrityChecker(this.db);
      integrityResults = await integrityChecker.getIntegritySummary();
      console.log('Integrity check results:', integrityResults);
    }

    // Log error summary
    if (errorSummary.totalErrors > 0) {
      console.log('Import completed with errors:', errorSummary);
      console.log(`  Total errors: ${errorSummary.totalErrors}`);
      console.log(`  Critical errors: ${errorSummary.criticalErrors}`);
      console.log(`  Retried errors: ${errorSummary.retriedErrors}`);
      console.log(`  Errors by phase:`, errorSummary.errorsByPhase);
    }

    // Prepare error object for database
    const hasErrors = errorSummary.totalErrors > 0;
    const hasIntegrityIssues =
      integrityResults && integrityResults.status === 'FAIL';
    const skippedPages = this.getSkippedPagesForStorage();
    const hasSkippedPages = Object.keys(skippedPages).length > 0;

    let errorData: unknown = undefined;
    if (!success) {
      errorData = {
        message: 'Import failed',
        errorSummary,
        skippedPages: hasSkippedPages ? skippedPages : undefined,
      };
    } else if (hasErrors || hasIntegrityIssues || hasSkippedPages) {
      errorData = {
        message: hasIntegrityIssues
          ? 'Import completed with integrity issues'
          : 'Import completed with non-critical errors',
        errorSummary: hasErrors ? errorSummary : undefined,
        integrity: hasIntegrityIssues ? integrityResults : undefined,
        skippedPages: hasSkippedPages ? skippedPages : undefined,
      };
    }

    if (this.currentSyncLogId) {
      await resilientDB.execute((db) =>
        db.syncLog.update({
          where: { id: this.currentSyncLogId! },
          data: {
            status: success ? 'COMPLETED' : 'FAILED',
            endTime: new Date(),
            recordsProcessed: metrics.validRecords,
            errors: errorData as Prisma.InputJsonValue,
          },
        })
      );
    }

    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: false,
          progress: success ? 100 : this.validationMetrics.totalFetched,
          currentOperation: null,
          lastSyncTime: success ? new Date() : undefined,
          lastSyncType: success ? 'FULL' : undefined,
          lastError: success
            ? hasErrors || hasIntegrityIssues
              ? `Completed with ${errorSummary.criticalErrors} critical errors`
              : null
            : 'Import failed',
          validationRate: validationSummary.validationRate,
          totalRecordsProcessed: validationSummary.totalRecords,
          validRecords: validationSummary.validRecords,
          invalidRecords: validationSummary.invalidRecords,
        },
      })
    );

    // Clear checkpoint on success
    if (success) {
      await this.checkpointManager.clearCheckpoint();
    }
  }

  /**
   * Get browser instance for scrapers.
   */
  getBrowser(): Browser {
    return this.browser;
  }

  /**
   * Get rate limiter for scrapers.
   */
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /**
   * Get batch processor.
   */
  getBatchProcessor(): BatchProcessor<unknown> {
    return this.batchProcessor;
  }

  /**
   * Get validation tracker for comprehensive metrics.
   */
  getValidationTracker(): ValidationMetricsTracker {
    return this.validationTracker;
  }

  /**
   * Get or create a system user for imports.
   */
  async getSystemUser(): Promise<string> {
    // Try to find an admin user first
    let systemUser = await this.db.user.findFirst({
      where: { role: 'admin' },
    });

    // If no admin exists, try to find any user
    if (!systemUser) {
      systemUser = await this.db.user.findFirst();
    }

    // If still no user exists, create a system user
    if (!systemUser) {
      systemUser = await this.db.user.create({
        data: {
          email: `system-import-${Date.now()}@mafia-insight.local`,
          name: 'System Import User',
          role: 'admin',
        },
      });
    }

    return systemUser.id;
  }

  /**
   * Get timeout manager for monitoring and configuration.
   */
  getTimeoutManager(): TimeoutManager {
    return this.timeoutManager;
  }

  /**
   * Check if import has timed out.
   * @returns True if the import has exceeded the maximum duration.
   */
  hasTimedOut(): boolean {
    return this.timeoutManager.isExceeded();
  }

  /**
   * Get remaining time before timeout.
   * @returns Remaining time in milliseconds.
   */
  getRemainingTime(): number {
    return this.timeoutManager.getRemaining();
  }

  /**
   * Throw error if timeout has occurred.
   * Should be called periodically during long-running operations.
   */
  checkTimeout(): void {
    if (this.hasTimedOut()) {
      const summary = this.timeoutManager.getSummary();
      throw new Error(
        `Import operation timed out after ${this.formatDuration(summary.elapsed)}. ` +
          `Maximum allowed duration: ${this.formatDuration(summary.maxDuration)}`
      );
    }
  }

  /**
   * Format duration in milliseconds to human-readable string.
   */
  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  }

  /**
   * Log an error without stopping the import process (best-effort error handling).
   * Errors are accumulated and reported at the end of the import.
   *
   * Inspired by NodeKit's structured error handling pattern.
   *
   * @param error The error to log
   * @param code Error classification code (e.g., 'EC-001', 'SCRAPE_FAILED')
   * @param context Additional context for traceability
   * @param willRetry Whether this operation will be retried
   */
  logError(
    error: Error,
    code: string,
    context?: {
      batchIndex?: number;
      entityId?: string;
      entityType?: string;
      operation?: string;
    },
    willRetry: boolean = false
  ): void {
    const errorLog: ImportErrorLog = {
      code,
      message: error.message,
      phase: this.currentPhase || 'CLUBS', // Default to first phase if not set
      context,
      error,
      timestamp: new Date(),
      willRetry,
    };

    this.errorLogs.push(errorLog);

    // Console log for immediate visibility
    console.error(
      `[${errorLog.phase}] Error ${code}: ${error.message}`,
      context ? `(context: ${JSON.stringify(context)})` : '',
      willRetry ? '(will retry)' : '(continuing)'
    );
  }

  /**
   * Get all logged errors.
   * @returns Array of error logs
   */
  getErrors(): ImportErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Get error summary statistics.
   */
  getErrorSummary(): {
    totalErrors: number;
    errorsByPhase: Record<ImportPhase, number>;
    errorsByCode: Record<string, number>;
    criticalErrors: number; // Errors that weren't retried
    retriedErrors: number;
  } {
    const errorsByPhase = this.phases.reduce(
      (acc, phase) => {
        acc[phase] = this.errorLogs.filter((e) => e.phase === phase).length;
        return acc;
      },
      {} as Record<ImportPhase, number>
    );

    const errorsByCode = this.errorLogs.reduce(
      (acc, log) => {
        acc[log.code] = (acc[log.code] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalErrors: this.errorLogs.length,
      errorsByPhase,
      errorsByCode,
      criticalErrors: this.errorLogs.filter((e) => !e.willRetry).length,
      retriedErrors: this.errorLogs.filter((e) => e.willRetry).length,
    };
  }

  /**
   * Set the current phase (for error logging context).
   */
  setPhase(phase: ImportPhase): void {
    this.currentPhase = phase;
    console.log(`Starting phase: ${phase}`);
  }

  /**
   * Wrap an async operation with best-effort error handling.
   * Logs errors but allows execution to continue.
   *
   * @param operation The operation to execute
   * @param errorCode Error code to use if operation fails
   * @param context Context for error logging
   * @returns Result of operation, or null if it failed
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorCode: string,
    context?: {
      batchIndex?: number;
      entityId?: string;
      entityType?: string;
      operation?: string;
    }
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error: unknown) {
      this.logError(error as Error, errorCode, context, false);
      return null;
    }
  }

  /**
   * Set the cancellation signal for graceful shutdown.
   * Inspired by p-queue's AbortSignal pattern for cancellation.
   *
   * @param signal AbortSignal to monitor for cancellation
   *
   * @example
   * const controller = new AbortController();
   * orchestrator.setCancellationSignal(controller.signal);
   * // Later, to cancel:
   * controller.abort();
   */
  setCancellationSignal(signal: AbortSignal): void {
    this.cancellationSignal = signal;
  }

  /**
   * Get the current cancellation signal.
   * Can be passed to child operations (scrapers, etc.) for propagation.
   *
   * @returns The current AbortSignal, or null if not set
   */
  getCancellationSignal(): AbortSignal | null {
    return this.cancellationSignal;
  }

  /**
   * Check if cancellation has been requested.
   *
   * @returns True if the import should be cancelled
   */
  isCancelled(): boolean {
    return this.cancellationSignal?.aborted || false;
  }

  /**
   * Check for cancellation and throw if cancelled.
   * Should be called periodically during long-running operations.
   *
   * @throws Error if import has been cancelled
   */
  checkCancellation(): void {
    if (this.isCancelled()) {
      throw new Error('Import operation was cancelled');
    }
  }

  /**
   * Request graceful cancellation of the import.
   *
   * Graceful cancellation process:
   * 1. Save current checkpoint (for resume capability)
   * 2. Update syncLog status to CANCELLED
   * 3. Update syncStatus to show cancellation
   * 4. Preserve checkpoint (don't delete)
   *
   * Pattern inspired by p-queue's cancellation handling:
   * - Saves state before aborting
   * - Allows operations to complete gracefully
   * - Preserves resume capability
   *
   * @returns Promise that resolves when cancellation is complete
   */
  async cancel(): Promise<void> {
    console.log('Cancellation requested, saving checkpoint...');

    // Save checkpoint if we have progress
    if (this.currentPhase && this.currentSyncLogId) {
      const checkpoint: ImportCheckpoint = {
        currentPhase: this.currentPhase,
        currentBatch: 0, // Will be set to actual batch in real implementation
        lastProcessedId: null,
        processedIds: Array.from(this.processedIds),
        progress: 0, // Will be calculated in real implementation
      };

      await this.checkpointManager.saveCheckpoint(checkpoint);
    }

    // Update syncLog to CANCELLED status
    if (this.currentSyncLogId) {
      await resilientDB.execute((db) =>
        db.syncLog.update({
          where: { id: this.currentSyncLogId! },
          data: {
            status: 'CANCELLED',
            endTime: new Date(),
          },
        })
      );
    }

    // Update syncStatus
    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: false,
          lastError: 'Import cancelled by user',
          updatedAt: new Date(),
        },
      })
    );

    console.log('Import cancelled gracefully');
  }
}
