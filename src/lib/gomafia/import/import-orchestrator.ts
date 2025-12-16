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
import {
  SkippedEntitiesManager,
  SkippedEntityData,
} from './skipped-entities-manager';
import { GameRawData } from '../validators/game-schema';
import { RetryManager, ErrorCategory } from './retry-manager';
import { ErrorSummaryTracker } from './error-summary-tracker';
import {
  calculateProcessingRate,
  calculateEstimatedTimeRemaining,
  calculateProgressPercentage,
} from './progress-calculator';

export type ImportPhase =
  | 'CLUBS'
  | 'PLAYERS'
  | 'CLUB_MEMBERS'
  | 'PLAYER_YEAR_STATS'
  | 'TOURNAMENTS'
  | 'TOURNAMENT_CHIEF_JUDGE'
  | 'PLAYER_TOURNAMENT_HISTORY'
  | 'JUDGES'
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
  private skippedEntitiesManager: SkippedEntitiesManager;
  private retryManager: RetryManager;
  private errorSummaryTracker: ErrorSummaryTracker;
  private currentSyncLogId: string | null = null;
  private errorLogs: ImportErrorLog[] = [];
  private currentPhase: ImportPhase | null = null;
  private processedIds: Set<string> = new Set(); // For duplicate prevention (T116)
  private cancellationSignal: AbortSignal | null = null; // For graceful cancellation (T118)
  private pausedSignal: AbortController | null = null; // For pause/resume functionality
  private skippedPagesByPhase: Map<ImportPhase, number[]> = new Map(); // Track skipped pages by phase
  private currentOrder: 'oldest-first' | 'newest-first' = 'newest-first'; // Chronological ordering preference
  private importStartTime: Date | null = null; // Start time for elapsed time calculation
  private phaseProgress: Map<
    ImportPhase,
    { processed: number; total: number }
  > = new Map(); // Track progress per phase
  private currentEntity: {
    id?: string;
    name?: string;
    pageNumber?: number;
  } | null = null; // Current entity being processed

  private readonly phases: ImportPhase[] = [
    'CLUBS',
    'PLAYERS',
    'CLUB_MEMBERS',
    'PLAYER_YEAR_STATS',
    'TOURNAMENTS',
    'TOURNAMENT_CHIEF_JUDGE',
    'PLAYER_TOURNAMENT_HISTORY',
    'JUDGES',
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
    this.rateLimiter = new RateLimiter(2000); // 2 seconds between requests (30 req/min max) to respect gomafia.pro servers
    this.batchProcessor = new BatchProcessor(db, 100); // 100 records per batch
    this.timeoutManager = new TimeoutManager(maxDurationMs);
    this.validationTracker = new ValidationMetricsTracker();
    this.skippedEntitiesManager = new SkippedEntitiesManager(db);
    this.retryManager = new RetryManager(3); // Max 3 retries with exponential backoff
    this.errorSummaryTracker = new ErrorSummaryTracker();
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
   * Checks for existing checkpoint and offers resume option if found.
   */
  async start(): Promise<string> {
    // Check for existing checkpoint before starting
    const existingCheckpoint = await this.loadCheckpoint();

    if (existingCheckpoint) {
      // Check if checkpoint is recent (within last 24 hours) or stale
      const checkpointAge = existingCheckpoint.importStartTimestamp
        ? new Date().getTime() -
          (existingCheckpoint.importStartTimestamp instanceof Date
            ? existingCheckpoint.importStartTimestamp.getTime()
            : new Date(existingCheckpoint.importStartTimestamp).getTime())
        : Infinity;

      const isStale = checkpointAge > 24 * 60 * 60 * 1000; // 24 hours

      if (isStale) {
        console.warn(
          `[ImportOrchestrator] Stale checkpoint detected (${Math.floor(checkpointAge / 1000 / 60 / 60)} hours old). Consider starting fresh.`
        );
      } else {
        console.log(
          `[ImportOrchestrator] Recent checkpoint found. Import can be resumed from phase ${existingCheckpoint.currentPhase}, batch ${existingCheckpoint.currentBatch}`
        );
      }
    }

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

    // Restore import start time from checkpoint if resuming, otherwise use current time
    if (existingCheckpoint?.importStartTimestamp) {
      this.importStartTime =
        existingCheckpoint.importStartTimestamp instanceof Date
          ? existingCheckpoint.importStartTimestamp
          : new Date(existingCheckpoint.importStartTimestamp);
    } else {
      this.importStartTime = new Date();
      this.phaseProgress.clear();
    }

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
   * Enhances checkpoint with phase progress map and import start timestamp.
   */
  async saveCheckpoint(checkpoint: ImportCheckpoint): Promise<void> {
    // Enhance checkpoint with phase progress and import start time
    const enhancedCheckpoint: ImportCheckpoint = {
      ...checkpoint,
      importStartTimestamp: this.importStartTime || new Date(),
      phaseProgress: Object.fromEntries(this.phaseProgress),
      lastProcessedIdByPhase: {
        ...(checkpoint.lastProcessedIdByPhase || {}),
        [checkpoint.currentPhase]: checkpoint.lastProcessedId,
      },
    };

    await this.checkpointManager.saveCheckpoint(enhancedCheckpoint);
  }

  /**
   * Load checkpoint for resume.
   * Restores processedIds Set, phase progress map, and import start time.
   */
  async loadCheckpoint(): Promise<ImportCheckpoint | null> {
    const checkpoint = await this.checkpointManager.loadCheckpoint();

    if (checkpoint) {
      // Restore processedIds Set from checkpoint
      this.processedIds = new Set(checkpoint.processedIds);

      // Restore phase progress map
      if (checkpoint.phaseProgress) {
        this.phaseProgress.clear();
        for (const [phase, progress] of Object.entries(
          checkpoint.phaseProgress
        )) {
          this.phaseProgress.set(phase as ImportPhase, progress);
        }
      }

      // Restore import start time (for elapsed time calculation)
      if (checkpoint.importStartTimestamp) {
        this.importStartTime =
          checkpoint.importStartTimestamp instanceof Date
            ? checkpoint.importStartTimestamp
            : new Date(checkpoint.importStartTimestamp);
      }

      console.log(
        `Loaded checkpoint: ${checkpoint.currentPhase} phase, batch ${checkpoint.currentBatch}, ${checkpoint.processedIds.length} entities processed, progress=${checkpoint.progress}%`
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
   * Resume import from checkpoint.
   * Loads checkpoint state, restores phase progress, and continues from saved position.
   */
  async resumeFromCheckpoint(): Promise<void> {
    const checkpoint = await this.loadCheckpoint();

    if (!checkpoint) {
      throw new Error('No checkpoint found to resume from');
    }

    // Validate checkpoint is valid
    if (!checkpoint.currentPhase || checkpoint.currentBatch < 0) {
      throw new Error('Invalid checkpoint: missing required fields');
    }

    // Restore phase progress map
    if (checkpoint.phaseProgress) {
      this.phaseProgress.clear();
      for (const [phase, progress] of Object.entries(
        checkpoint.phaseProgress
      )) {
        this.phaseProgress.set(phase as ImportPhase, progress);
      }
    }

    // Restore import start time for elapsed time calculation
    if (checkpoint.importStartTimestamp) {
      this.importStartTime =
        checkpoint.importStartTimestamp instanceof Date
          ? checkpoint.importStartTimestamp
          : new Date(checkpoint.importStartTimestamp);
    }

    // Set current phase to checkpoint phase
    this.currentPhase = checkpoint.currentPhase;

    // Restore processedIds Set to skip already-processed entities
    this.processedIds = new Set(checkpoint.processedIds);

    console.log(
      `[ImportOrchestrator] Resuming from checkpoint: phase=${checkpoint.currentPhase}, batch=${checkpoint.currentBatch}, progress=${checkpoint.progress}%, processed=${checkpoint.processedIds.length} entities`
    );

    // Update sync status to show resume
    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: true,
          progress: checkpoint.progress,
          currentOperation: `Resuming from checkpoint: ${checkpoint.currentPhase} phase`,
          updatedAt: new Date(),
        },
      })
    );
  }

  /**
   * Get all import phases.
   */
  getPhases(): ImportPhase[] {
    return [...this.phases];
  }

  /**
   * Calculate overall progress based on current phase.
   * @deprecated This method is kept for backward compatibility with tests only.
   * Production code uses calculateOverallProgress() instead.
   * @param currentPhaseIndex Current phase index (0-based)
   * @param totalPhases Total number of phases
   * @returns Progress percentage (0-100)
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
   * Check if validation threshold is met after a batch.
   * If threshold not met (below configured threshold, default 98%), pauses import and logs detailed errors.
   *
   * The threshold is configurable via VALIDATION_THRESHOLD environment variable.
   *
   * @param phase The current import phase
   * @param batchIndex The batch index (for logging)
   * @returns True if threshold is met, false if import should pause
   */
  async checkValidationThreshold(
    phase: ImportPhase,
    batchIndex?: number
  ): Promise<boolean> {
    const summary = this.validationTracker.getSummary();

    if (summary.meetsThreshold) {
      return true;
    }

    // Threshold not met - pause import and log detailed errors
    const errors = this.validationTracker.getErrors();
    const errorSummary = this.getErrorSummary();
    const threshold = this.validationTracker.getThreshold();

    console.error(
      `[ImportOrchestrator] Validation threshold not met: ${summary.validationRate}% < ${threshold}%`
    );
    console.error(
      `[ImportOrchestrator] Total records: ${summary.totalRecords}, Valid: ${summary.validRecords}, Invalid: ${summary.invalidRecords}`
    );
    console.error(
      `[ImportOrchestrator] Errors by entity: ${JSON.stringify(summary.errorsByEntity)}`
    );

    // Store batch-level validation results in SyncLog.errors
    if (this.currentSyncLogId) {
      const existingSyncLog = await resilientDB.execute((db) =>
        db.syncLog.findUnique({
          where: { id: this.currentSyncLogId! },
          select: { errors: true },
        })
      );

      let existingErrors: Record<string, unknown> = {};
      if (
        existingSyncLog?.errors &&
        typeof existingSyncLog.errors === 'object'
      ) {
        existingErrors = existingSyncLog.errors as Record<string, unknown>;
      }

      const updatedErrors: Record<string, unknown> = {
        ...existingErrors,
        validationMetrics: {
          ...((existingErrors.validationMetrics as Record<string, unknown>) ||
            {}),
          thresholdFailure: {
            phase,
            batchIndex: batchIndex ?? null,
            validationRate: summary.validationRate,
            meetsThreshold: false,
            totalRecords: summary.totalRecords,
            validRecords: summary.validRecords,
            invalidRecords: summary.invalidRecords,
            errorsByEntity: summary.errorsByEntity,
            recentErrors: errors.slice(-50),
            errorSummary,
            timestamp: new Date().toISOString(),
          },
        },
      };

      await resilientDB.execute((db) =>
        db.syncLog.update({
          where: { id: this.currentSyncLogId! },
          data: {
            errors: updatedErrors as Prisma.InputJsonValue,
          },
        })
      );
    }

    // Update sync status to indicate validation failure
    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: false,
          currentOperation: `Validation threshold not met: ${summary.validationRate}% < ${threshold}%`,
          lastError: `Data quality below threshold (${summary.validationRate}% < ${threshold}%). Please review errors.`,
          validationRate: summary.validationRate,
          totalRecordsProcessed: summary.totalRecords,
          validRecords: summary.validRecords,
          invalidRecords: summary.invalidRecords,
          updatedAt: new Date(),
        },
      })
    );

    return false;
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
   * Run phase-level integrity checks after a phase completes.
   * Performs integrity checks relevant to the completed phase (Story 2.9: AC #2).
   *
   * @param phase The import phase that just completed
   */
  async runPhaseIntegrityChecks(phase: ImportPhase): Promise<void> {
    const integrityChecker = new IntegrityChecker(this.db);

    // Run checks relevant to the completed phase
    let phaseChecks: Array<
      Promise<import('./integrity-checker').IntegrityCheckResult>
    > = [];

    switch (phase) {
      case 'CLUBS':
        // After clubs phase, check player-club links if players exist
        phaseChecks = [integrityChecker.checkPlayerClubLinks()];
        break;
      case 'PLAYERS':
        // After players phase, check player-club links
        phaseChecks = [integrityChecker.checkPlayerClubLinks()];
        break;
      case 'TOURNAMENTS':
        // After tournaments phase, check tournament-chief judge links
        phaseChecks = [integrityChecker.checkTournamentChiefJudgeLinks()];
        break;
      case 'GAMES':
        // After games phase, check game-tournament links, game-judge links, and game participation links
        phaseChecks = [
          integrityChecker.checkGameTournamentLinks(),
          integrityChecker.checkGameJudgeLinks(),
          integrityChecker.checkGameParticipationLinks(),
        ];
        break;
      case 'STATISTICS':
        // After statistics phase, check player-tournament links
        phaseChecks = [integrityChecker.checkPlayerTournamentLinks()];
        break;
      default:
        // For other phases, skip phase-level checks (will be checked in full audit)
        return;
    }

    try {
      const results = await Promise.all(phaseChecks);
      const failedChecks = results.filter((r) => !r.passed);

      if (failedChecks.length > 0) {
        console.warn(
          `[ImportOrchestrator] Phase-level integrity checks failed for phase ${phase}:`,
          failedChecks.map((c) => c.checkName)
        );
        // Log violations but don't fail import (Option 2: Skip and log)
        for (const check of failedChecks) {
          if (check.violations) {
            console.warn(
              `[ImportOrchestrator] Integrity violations in ${check.checkName}:`,
              check.violations.length
            );
          }
        }
      } else {
        console.log(
          `[ImportOrchestrator] Phase-level integrity checks passed for phase ${phase}`
        );
      }

      // Store phase-level integrity check results in sync log
      await this.storeIntegrityResultsForPhase(phase, results);
    } catch (error) {
      console.error(
        `[ImportOrchestrator] Error running phase-level integrity checks for ${phase}:`,
        error
      );
      // Don't fail import on integrity check errors, just log them
    }
  }

  /**
   * Store integrity check results in SyncLog.errors JSON field after a phase completes.
   * This allows tracking integrity check results per phase (Story 2.9: AC #2).
   *
   * @param phase The import phase that just completed
   * @param results Integrity check results for this phase
   */
  async storeIntegrityResultsForPhase(
    phase: ImportPhase,
    results: Array<import('./integrity-checker').IntegrityCheckResult>
  ): Promise<void> {
    if (!this.currentSyncLogId) {
      console.warn(
        '[ImportOrchestrator] No sync log ID available, skipping integrity results storage'
      );
      return;
    }

    // Get existing errors from SyncLog
    const existingSyncLog = await resilientDB.execute((db) =>
      db.syncLog.findUnique({
        where: { id: this.currentSyncLogId! },
        select: { errors: true },
      })
    );

    // Parse existing errors or initialize empty structure
    let existingErrors: Record<string, unknown> = {};
    if (existingSyncLog?.errors && typeof existingSyncLog.errors === 'object') {
      existingErrors = existingSyncLog.errors as Record<string, unknown>;
    }

    // Prepare integrity results for this phase
    const phaseIntegrityResults = {
      checks: results.map((r) => ({
        checkName: r.checkName,
        passed: r.passed,
        totalChecked: r.totalChecked,
        errorCount: r.errors.length,
        violations: r.violations || [],
      })),
      passed: results.every((r) => r.passed),
      failedChecks: results.filter((r) => !r.passed).length,
    };

    // Store in integrityResults structure
    const updatedErrors: Record<string, unknown> = {
      ...existingErrors,
      integrityResults: {
        ...((existingErrors.integrityResults as Record<string, unknown>) || {}),
        [phase]: phaseIntegrityResults,
      },
    };

    // Update SyncLog with integrity results
    await resilientDB.execute((db) =>
      db.syncLog.update({
        where: { id: this.currentSyncLogId! },
        data: {
          errors: updatedErrors as Prisma.InputJsonValue,
        },
      })
    );
  }

  /**
   * Store validation metrics in SyncLog.errors JSON field after a phase completes.
   * This allows tracking validation metrics per phase and checking threshold compliance.
   *
   * @param phase The import phase that just completed
   */
  async storeValidationMetricsForPhase(phase: ImportPhase): Promise<void> {
    if (!this.currentSyncLogId) {
      console.warn(
        '[ImportOrchestrator] No sync log ID available, skipping validation metrics storage'
      );
      return;
    }

    const validationSummary = this.validationTracker.getSummary();
    const validationErrors = this.validationTracker.getErrors();

    // Get existing errors from SyncLog
    const existingSyncLog = await resilientDB.execute((db) =>
      db.syncLog.findUnique({
        where: { id: this.currentSyncLogId! },
        select: { errors: true },
      })
    );

    // Parse existing errors or initialize empty structure
    let existingErrors: Record<string, unknown> = {};
    if (existingSyncLog?.errors && typeof existingSyncLog.errors === 'object') {
      existingErrors = existingSyncLog.errors as Record<string, unknown>;
    }

    // Update validation metrics for this phase
    const phaseMetrics = {
      validationRate: validationSummary.validationRate,
      meetsThreshold: validationSummary.meetsThreshold,
      totalRecords: validationSummary.totalRecords,
      validRecords: validationSummary.validRecords,
      invalidRecords: validationSummary.invalidRecords,
      errorsByEntity: validationSummary.errorsByEntity,
      recentErrors: validationErrors.slice(-50), // Last 50 errors
    };

    // Store in validationMetrics structure
    const updatedErrors: Record<string, unknown> = {
      ...existingErrors,
      validationMetrics: {
        ...((existingErrors.validationMetrics as Record<string, unknown>) ||
          {}),
        [phase]: phaseMetrics,
        // Also store overall summary
        overall: {
          validationRate: validationSummary.validationRate,
          meetsThreshold: validationSummary.meetsThreshold,
          totalRecords: validationSummary.totalRecords,
          validRecords: validationSummary.validRecords,
          invalidRecords: validationSummary.invalidRecords,
          errorsByEntity: validationSummary.errorsByEntity,
        },
      },
    };

    // Update SyncLog with validation metrics
    await resilientDB.execute((db) =>
      db.syncLog.update({
        where: { id: this.currentSyncLogId! },
        data: {
          errors: updatedErrors as Prisma.InputJsonValue,
        },
      })
    );

    console.log(
      `[ImportOrchestrator] Stored validation metrics for phase ${phase}: ${validationSummary.validationRate}% (${validationSummary.validRecords}/${validationSummary.totalRecords} valid)`
    );
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
    const errorSummaryData = this.errorSummaryTracker.getSummary();
    const errorSummaryMessage = this.errorSummaryTracker.getSummaryMessage();

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
      console.log(`  Error summary message: ${errorSummaryMessage}`);
    }

    // Prepare error object for database
    const hasErrors = errorSummary.totalErrors > 0;
    const hasIntegrityIssues =
      integrityResults && integrityResults.status === 'FAIL';
    const skippedPages = this.getSkippedPagesForStorage();
    const hasSkippedPages = Object.keys(skippedPages).length > 0;

    // Get existing errors from SyncLog to preserve validation metrics
    const existingSyncLog = await resilientDB.execute((db) =>
      db.syncLog.findUnique({
        where: { id: this.currentSyncLogId! },
        select: { errors: true },
      })
    );

    let existingErrors: Record<string, unknown> = {};
    if (existingSyncLog?.errors && typeof existingSyncLog.errors === 'object') {
      existingErrors = existingSyncLog.errors as Record<string, unknown>;
    }

    // Build error data structure with both errorSummary and validationMetrics
    let errorData: unknown = undefined;
    if (!success || hasErrors || hasIntegrityIssues || hasSkippedPages) {
      // Use errorSummary (from errorLogs) if errorSummaryData is empty but errors exist
      const summaryToUse =
        errorSummaryData.totalErrors > 0
          ? errorSummaryData
          : errorSummary.totalErrors > 0
            ? errorSummary
            : undefined;

      // Determine appropriate error message
      let errorMessage: string;
      if (!success) {
        errorMessage = 'Import failed';
      } else if (hasIntegrityIssues) {
        errorMessage = 'Import completed with integrity issues';
      } else if (hasErrors && summaryToUse) {
        // Check if all errors are retried (non-critical)
        // Only errorSummary has criticalErrors, errorSummaryData (ErrorSummary) does not
        const hasCriticalErrors =
          'criticalErrors' in summaryToUse
            ? summaryToUse.criticalErrors > 0
            : true; // If criticalErrors doesn't exist, assume there are critical errors
        const allErrorsRetried =
          summaryToUse.totalErrors > 0 && !hasCriticalErrors;
        errorMessage = allErrorsRetried
          ? 'Import completed with non-critical errors'
          : errorSummaryMessage || 'Import completed with errors';
      } else {
        errorMessage = errorSummaryMessage || 'Import completed successfully';
      }

      errorData = {
        ...existingErrors,
        errorSummary: summaryToUse,
        validationMetrics: existingErrors.validationMetrics || undefined,
        message: errorMessage,
        integrity: hasIntegrityIssues ? integrityResults : undefined,
        skippedPages: hasSkippedPages ? skippedPages : undefined,
      };
    } else if (existingErrors.validationMetrics) {
      // Preserve validation metrics even if no errors
      errorData = {
        validationMetrics: existingErrors.validationMetrics,
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

    // Clear checkpoint on success or when user chooses "Start fresh"
    if (success) {
      await this.checkpointManager.clearCheckpoint();
    }
    // Note: Checkpoint is kept on failure to allow manual resume
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
    // Initialize phase progress if not exists
    if (!this.phaseProgress.has(phase)) {
      this.phaseProgress.set(phase, { processed: 0, total: 0 });
    }
    console.log(`Starting phase: ${phase}`);
    // Update sync status with phase change
    this.updateProgressState().catch((error) => {
      console.error(
        '[ImportOrchestrator] Failed to update progress state:',
        error
      );
    });
  }

  /**
   * Update progress tracking for current phase.
   * @param processedCount Number of entities processed in current phase
   * @param totalCount Total number of entities in current phase
   * @param currentEntity Current entity being processed (optional)
   */
  updatePhaseProgress(
    processedCount: number,
    totalCount: number,
    currentEntity?: { id?: string; name?: string; pageNumber?: number }
  ): void {
    if (this.currentPhase) {
      this.phaseProgress.set(this.currentPhase, {
        processed: processedCount,
        total: totalCount,
      });
      this.currentEntity = currentEntity || null;
      // Update progress state in database
      this.updateProgressState().catch((error) => {
        console.error(
          '[ImportOrchestrator] Failed to update progress state:',
          error
        );
      });
    }
  }

  /**
   * Update progress state in SyncStatus table with detailed metrics.
   * Calculates processing rate, estimated time remaining, and overall progress.
   * Also stores detailed progress metrics in SyncLog.errors JSON field.
   */
  private async updateProgressState(): Promise<void> {
    if (!this.currentSyncLogId || !this.currentPhase || !this.importStartTime) {
      return;
    }

    const phaseProgress = this.phaseProgress.get(this.currentPhase) || {
      processed: 0,
      total: 0,
    };

    // Calculate elapsed time
    const elapsedSeconds =
      (new Date().getTime() - this.importStartTime.getTime()) / 1000;

    // Calculate processing rate
    const processingRate = calculateProcessingRate(
      phaseProgress.processed,
      elapsedSeconds
    );

    // Calculate estimated time remaining for current phase
    const remainingCount = Math.max(
      0,
      phaseProgress.total - phaseProgress.processed
    );
    const estimatedSecondsRemaining = calculateEstimatedTimeRemaining(
      remainingCount,
      processingRate
    );

    // Calculate overall progress percentage
    const overallProgress = this.calculateOverallProgress();

    // Build current operation message
    let currentOperation = `Processing ${this.currentPhase}`;
    if (this.currentEntity) {
      if (this.currentEntity.name) {
        currentOperation += `: ${this.currentEntity.name}`;
      } else if (this.currentEntity.id) {
        currentOperation += `: ${this.currentEntity.id}`;
      } else if (this.currentEntity.pageNumber !== undefined) {
        currentOperation += `: page ${this.currentEntity.pageNumber}`;
      }
    }
    if (phaseProgress.total > 0) {
      currentOperation += ` (${phaseProgress.processed} of ${phaseProgress.total})`;
    }

    // Get existing errors from SyncLog to preserve other data
    const existingSyncLog = await resilientDB.execute((db) =>
      db.syncLog.findUnique({
        where: { id: this.currentSyncLogId! },
        select: { errors: true, startTime: true },
      })
    );

    let existingErrors: Record<string, unknown> = {};
    if (existingSyncLog?.errors && typeof existingSyncLog.errors === 'object') {
      existingErrors = existingSyncLog.errors as Record<string, unknown>;
    }

    // Build detailed progress metrics
    const progressMetrics = {
      currentPhase: this.currentPhase,
      phaseProgress: {
        processed: phaseProgress.processed,
        total: phaseProgress.total,
      },
      currentEntity: this.currentEntity || null,
      processingRate,
      elapsedSeconds,
      estimatedSecondsRemaining,
      overallProgress,
      startTime: this.importStartTime.toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    // Update SyncLog with detailed progress metrics
    await resilientDB.execute((db) =>
      db.syncLog.update({
        where: { id: this.currentSyncLogId! },
        data: {
          errors: {
            ...existingErrors,
            progressMetrics,
          } as Prisma.InputJsonValue,
        },
      })
    );

    // Update SyncStatus with basic progress (for quick access)
    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: 'current' },
        data: {
          progress: overallProgress,
          currentOperation,
          totalRecordsProcessed: phaseProgress.processed,
          updatedAt: new Date(),
        },
      })
    );
  }

  /**
   * Calculate overall progress across all phases.
   * @returns Progress percentage (0-100)
   */
  private calculateOverallProgress(): number {
    if (this.phases.length === 0) {
      return 0;
    }

    const currentPhaseIndex = this.currentPhase
      ? this.phases.indexOf(this.currentPhase)
      : 0;

    // Base progress from completed phases
    const completedPhasesProgress =
      (currentPhaseIndex / this.phases.length) * 100;

    // Current phase progress
    const phaseProgress = this.phaseProgress.get(
      this.currentPhase || this.phases[0]
    ) || {
      processed: 0,
      total: 0,
    };
    const currentPhaseProgress = calculateProgressPercentage(
      phaseProgress.processed,
      phaseProgress.total
    );

    // Weight current phase progress by phase weight (1/number of phases)
    const phaseWeight = 100 / this.phases.length;
    const weightedPhaseProgress = (currentPhaseProgress / 100) * phaseWeight;

    return Math.min(
      100,
      Math.round(completedPhasesProgress + weightedPhaseProgress)
    );
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
   * Execute an operation with error handling, retry logic, and permanent error recording.
   * For transient errors: retries with exponential backoff.
   * For permanent errors: logs, records in SkippedEntity, and continues processing.
   *
   * @param operation The operation to execute
   * @param context Context for error logging and SkippedEntity recording
   * @returns Result of operation, or null if it failed permanently
   */
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: {
      entityId?: string;
      entityType: string;
      phase: ImportPhase;
      pageNumber?: number;
    }
  ): Promise<T | null> {
    try {
      // Execute with retry for transient errors
      return await this.retryManager.execute(operation, {
        signal: this.cancellationSignal || undefined,
        onRetryAttempt: (attempt, error, _delay) => {
          const classification = this.retryManager.categorizeError(error);
          this.errorSummaryTracker.recordError(
            error,
            context.phase,
            classification.category,
            classification.code,
            classification.type,
            {
              entityId: context.entityId,
              entityType: context.entityType,
            }
          );
          this.logError(
            error,
            classification.code,
            {
              entityId: context.entityId,
              entityType: context.entityType,
              operation: 'retry',
            },
            true
          );
        },
      });
    } catch (error: unknown) {
      const err = error as Error;
      const classification = this.retryManager.categorizeError(err);

      // Record error in summary tracker
      this.errorSummaryTracker.recordError(
        err,
        context.phase,
        classification.category,
        classification.code,
        classification.type,
        {
          entityId: context.entityId,
          entityType: context.entityType,
        }
      );

      // Log error with full context
      this.logError(
        err,
        classification.code,
        {
          entityId: context.entityId,
          entityType: context.entityType,
        },
        classification.category === ErrorCategory.TRANSIENT
      );

      // For permanent errors, record in SkippedEntity and continue
      if (classification.category === ErrorCategory.PERMANENT) {
        try {
          await this.skippedEntitiesManager.recordSkippedEntity({
            phase: context.phase,
            entityType: context.entityType,
            entityId: context.entityId,
            pageNumber: context.pageNumber,
            errorCode: classification.code,
            errorMessage: err.message,
            errorDetails: {
              stackTrace: err.stack,
              type: classification.type,
            },
            syncLogId: this.currentSyncLogId || undefined,
          });

          this.errorSummaryTracker.recordSkippedEntity(context.phase);

          console.log(
            `[ImportOrchestrator] Recorded permanent error for ${context.entityType} ${context.entityId || 'unknown'}: ${err.message}`
          );
        } catch (recordError) {
          console.error(
            '[ImportOrchestrator] Failed to record skipped entity:',
            recordError
          );
        }
      }

      // Continue processing (return null to indicate failure)
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
   * Check if import is paused.
   * Should be called periodically during long-running operations.
   *
   * @throws Error if import has been paused
   */
  checkPaused(): void {
    if (this.isPaused()) {
      throw new Error('Import operation is paused');
    }
  }

  /**
   * Check if import is paused.
   *
   * @returns True if the import is paused
   */
  isPaused(): boolean {
    return this.pausedSignal?.signal.aborted || false;
  }

  /**
   * Pause the import process.
   * Saves checkpoint and sets pause signal.
   */
  async pause(): Promise<void> {
    console.log('Pausing import, saving checkpoint...');

    // Create pause signal
    this.pausedSignal = new AbortController();
    this.pausedSignal.abort('Import paused by user');

    // Save checkpoint with pause flag
    if (this.currentPhase && this.currentSyncLogId) {
      const checkpoint: ImportCheckpoint = {
        currentPhase: this.currentPhase,
        currentBatch: 0, // Will be set to actual batch in real implementation
        lastProcessedId: null,
        processedIds: Array.from(this.processedIds),
        progress: 0, // Will be calculated in real implementation
        isPaused: true,
      };

      await this.checkpointManager.saveCheckpoint(checkpoint);
    }

    // Update syncStatus
    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: false,
          currentOperation: 'Import paused',
          updatedAt: new Date(),
        },
      })
    );

    // Update checkpoint in database
    await resilientDB.execute((db) =>
      db.importCheckpoint.updateMany({
        where: { id: 'current' },
        data: {
          isPaused: true,
          lastUpdated: new Date(),
        },
      })
    );

    console.log('Import paused successfully');
  }

  /**
   * Resume the import process.
   * Clears pause signal and resumes from checkpoint.
   */
  async resume(): Promise<void> {
    console.log('Resuming import from checkpoint...');

    // Clear pause signal
    this.pausedSignal = null;

    // Update syncStatus
    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: 'current' },
        data: {
          isRunning: true,
          currentOperation: 'Resuming import...',
          updatedAt: new Date(),
        },
      })
    );

    // Update checkpoint in database
    await resilientDB.execute((db) =>
      db.importCheckpoint.updateMany({
        where: { id: 'current' },
        data: {
          isPaused: false,
          lastUpdated: new Date(),
        },
      })
    );

    console.log('Import resumed successfully');
  }

  /**
   * Record a skipped entity for later retry.
   */
  async recordSkippedEntity(data: SkippedEntityData): Promise<string> {
    return await this.skippedEntitiesManager.recordSkippedEntity({
      ...data,
      syncLogId: this.currentSyncLogId ?? undefined,
    });
  }

  /**
   * Get skipped entities manager.
   */
  getSkippedEntitiesManager(): SkippedEntitiesManager {
    return this.skippedEntitiesManager;
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

    // Clear pause signal if exists
    this.pausedSignal = null;

    // Save checkpoint if we have progress
    if (this.currentPhase && this.currentSyncLogId) {
      const checkpoint: ImportCheckpoint = {
        currentPhase: this.currentPhase,
        currentBatch: 0, // Will be set to actual batch in real implementation
        lastProcessedId: null,
        processedIds: Array.from(this.processedIds),
        progress: 0, // Will be calculated in real implementation
        isPaused: false,
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

  /**
   * Import historical data for a specific user's gomafia.pro profile.
   * Discovers profile data, initializes phase-based import, and tracks progress.
   *
   * @param userId The user ID requesting the import
   * @param playerId The gomafia.pro player ID to import
   * @param options Import options including ordering preference
   * @returns Promise resolving to job ID for tracking
   */
  async importHistoricalData(
    userId: string,
    playerId: string,
    options?: {
      order?: 'oldest-first' | 'newest-first';
    }
  ): Promise<{ jobId: string }> {
    const order = options?.order || 'newest-first';

    // Create sync log entry for historical import
    const syncLog = await resilientDB.execute((db) =>
      db.syncLog.create({
        data: {
          type: 'HISTORICAL',
          status: 'RUNNING',
          startTime: new Date(),
        },
      })
    );

    this.currentSyncLogId = syncLog.id;

    // Discover profile data (total games, date range)
    const page = await this.browser.newPage();
    try {
      const { PlayerStatsScraper } = await import(
        '@/lib/gomafia/scrapers/player-stats-scraper'
      );
      const scraper = new PlayerStatsScraper(page);
      const discoveryData = await scraper.discoverProfileData(playerId);

      if (!discoveryData.profileExists) {
        throw new Error(`Profile not found for player ID: ${playerId}`);
      }

      // Initialize user-specific sync status
      await resilientDB.execute((db) =>
        db.syncStatus.upsert({
          where: { id: `user-${userId}` },
          update: {
            isRunning: true,
            progress: 0,
            currentOperation: 'Initializing historical import...',
            lastError: null,
            totalRecordsProcessed: discoveryData.totalGames,
            updatedAt: new Date(),
          },
          create: {
            id: `user-${userId}`,
            isRunning: true,
            progress: 0,
            currentOperation: 'Initializing historical import...',
            totalRecordsProcessed: discoveryData.totalGames,
          },
        })
      );

      // Store discovery data and import context for later use
      // This will be used by the phase-based import orchestration
      await resilientDB.execute((db) =>
        db.importCheckpoint.upsert({
          where: { id: `user-${userId}` },
          update: {
            currentPhase: 'DISCOVERY',
            currentBatch: 0,
            lastProcessedId: null,
            processedIds: [],
            progress: 0,
            isPaused: false,
            lastUpdated: new Date(),
          },
          create: {
            id: `user-${userId}`,
            currentPhase: 'DISCOVERY',
            currentBatch: 0,
            lastProcessedId: null,
            processedIds: [],
            progress: 0,
            isPaused: false,
          },
        })
      );

      console.log(
        `[Historical Import] Discovered profile for player ${playerId}: ${discoveryData.totalGames} games, order: ${order}`
      );

      // Return job ID - actual import will be executed in background
      return { jobId: syncLog.id };
    } finally {
      await page.close();
    }
  }

  /**
   * Execute phase-based import orchestration for historical data.
   * Processes phases in order: Clubs → Players → Tournaments → Games → Statistics → Judges
   * For historical imports, focuses on the specific player's data.
   * Supports chronological ordering (oldest-first or newest-first).
   *
   * @param userId The user ID requesting the import
   * @param playerId The gomafia.pro player ID to import
   * @param order The ordering preference (oldest-first or newest-first)
   */
  async executeHistoricalImportPhases(
    userId: string,
    playerId: string,
    order: 'oldest-first' | 'newest-first'
  ): Promise<void> {
    // Store ordering preference for use in phases
    this.currentOrder = order;
    console.log(
      `[Historical Import] Executing phases for player ${playerId}, order: ${order}`
    );

    // Import phase implementations
    const { ClubsPhase } = await import('./phases/clubs-phase');
    const { PlayersPhase } = await import('./phases/players-phase');
    const { TournamentsPhase } = await import('./phases/tournaments-phase');
    const { GamesPhase } = await import('./phases/games-phase');
    const { StatisticsPhase } = await import('./phases/statistics-phase');
    const { JudgesPhase } = await import('./phases/judges-phase');

    // Historical import phases (subset of full import)
    // Focus on phases relevant to player's historical data
    const phases = [
      { name: 'CLUBS', phase: new ClubsPhase(this) },
      { name: 'PLAYERS', phase: new PlayersPhase(this) },
      { name: 'TOURNAMENTS', phase: new TournamentsPhase(this) },
      { name: 'GAMES', phase: new GamesPhase(this) },
      { name: 'STATISTICS', phase: new StatisticsPhase(this) },
      { name: 'JUDGES', phase: new JudgesPhase(this) },
    ];

    for (let i = 0; i < phases.length; i++) {
      // Check for cancellation before each phase
      if (this.isCancelled()) {
        console.log(
          '[Historical Import] Cancellation detected, calling orchestrator.cancel()...'
        );
        await this.cancel();
        return;
      }

      // Check if import is paused
      if (this.isPaused()) {
        console.log(
          '[Historical Import] Import is paused, waiting for resume...'
        );
        while (this.isPaused()) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (this.isCancelled()) {
            await this.cancel();
            return;
          }
        }
        console.log('[Historical Import] Import resumed, continuing...');
      }

      const { name, phase } = phases[i];
      const phaseStartProgress = Math.floor((i / phases.length) * 100);

      console.log(
        `[Historical Import] Starting phase ${i + 1}/${phases.length}: ${name}`
      );

      // Update progress
      await resilientDB.execute((db) =>
        db.syncStatus.update({
          where: { id: `user-${userId}` },
          data: {
            isRunning: true,
            progress: phaseStartProgress,
            currentOperation: `Executing ${name} phase for player ${playerId}`,
            updatedAt: new Date(),
          },
        })
      );

      // Execute phase (may throw if cancelled during execution)
      try {
        await phase.execute();
        console.log(`[Historical Import] Completed phase: ${name}`);

        // Run phase-level integrity checks after phase completes (Story 2.9: AC #2)
        await this.runPhaseIntegrityChecks(name as ImportPhase);
      } catch (error: unknown) {
        const isCancellationError =
          error instanceof Error &&
          error.message.toLowerCase().includes('cancelled');

        if (isCancellationError) {
          console.log(
            '[Historical Import] Phase cancelled, calling orchestrator.cancel()...'
          );
          await this.cancel();
          return;
        }
        // Otherwise, log error and continue with next phase
        console.error(
          `[Historical Import] Phase ${name} failed:`,
          error instanceof Error ? error.message : error
        );
        // Continue with next phase even if this one failed
      }
    }

    // Run full integrity audit before marking import as complete (Story 2.9: AC #2)
    console.log(
      '[Historical Import] Running full integrity audit before completion...'
    );
    try {
      const integrityChecker = new IntegrityChecker(this.db);
      const integrityResults = await integrityChecker.getIntegritySummary();
      console.log('[Historical Import] Full integrity audit results:', {
        status: integrityResults.status,
        passedChecks: integrityResults.passedChecks,
        failedChecks: integrityResults.failedChecks,
      });

      // Store full integrity audit results
      if (this.currentSyncLogId) {
        const existingSyncLog = await resilientDB.execute((db) =>
          db.syncLog.findUnique({
            where: { id: this.currentSyncLogId! },
            select: { errors: true },
          })
        );

        let existingErrors: Record<string, unknown> = {};
        if (
          existingSyncLog?.errors &&
          typeof existingSyncLog.errors === 'object'
        ) {
          existingErrors = existingSyncLog.errors as Record<string, unknown>;
        }

        const updatedErrors: Record<string, unknown> = {
          ...existingErrors,
          integrityResults: {
            ...((existingErrors.integrityResults as Record<string, unknown>) ||
              {}),
            fullAudit: {
              status: integrityResults.status,
              totalChecks: integrityResults.totalChecks,
              passedChecks: integrityResults.passedChecks,
              failedChecks: integrityResults.failedChecks,
              message: integrityResults.message,
              issues: integrityResults.issues || [],
              timestamp: new Date().toISOString(),
            },
          },
        };

        await resilientDB.execute((db) =>
          db.syncLog.update({
            where: { id: this.currentSyncLogId! },
            data: {
              errors: updatedErrors as Prisma.InputJsonValue,
            },
          })
        );
      }

      // Log integrity issues but don't fail import (Option 2: Skip and log strategy)
      if (integrityResults.status === 'FAIL') {
        console.warn(
          '[Historical Import] Import completed with integrity issues:',
          integrityResults.issues?.slice(0, 10) // Log first 10 issues
        );
      }
    } catch (error) {
      console.error(
        '[Historical Import] Error running full integrity audit:',
        error
      );
      // Don't fail import on integrity check errors, just log them
    }

    // Mark as completed
    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: `user-${userId}` },
        data: {
          isRunning: false,
          progress: 100,
          currentOperation: null,
          lastSyncTime: new Date(),
          lastSyncType: 'HISTORICAL',
        },
      })
    );

    const syncLogId = this.currentSyncLogId;
    if (syncLogId) {
      await resilientDB.execute((db) =>
        db.syncLog.update({
          where: { id: syncLogId },
          data: {
            status: 'COMPLETED',
            endTime: new Date(),
          },
        })
      );
    }

    console.log('[Historical Import] Import completed successfully');
  }

  /**
   * Incremental sync method for scheduled synchronization.
   * Imports only new games since lastSyncAt and updates existing games if data changed.
   *
   * @param userId The user ID requesting the sync
   * @param lastSyncAt The timestamp of the last successful sync
   * @returns Promise resolving to sync result with summary
   */
  async syncIncremental(
    userId: string,
    lastSyncAt: Date
  ): Promise<{
    gamesImported: number;
    gamesUpdated: number;
    errors: number;
    success: boolean;
  }> {
    console.log(
      `[Incremental Sync] Starting incremental sync for user ${userId}, lastSyncAt: ${lastSyncAt.toISOString()}`
    );

    // Create sync log entry for incremental sync
    const syncLog = await resilientDB.execute((db) =>
      db.syncLog.create({
        data: {
          userId: userId,
          type: 'INCREMENTAL',
          status: 'RUNNING',
          startTime: new Date(),
        },
      })
    );

    this.currentSyncLogId = syncLog.id;

    let gamesImported = 0;
    let gamesUpdated = 0;
    let errors = 0;

    try {
      // Update user-specific sync status
      await resilientDB.execute((db) =>
        db.syncStatus.upsert({
          where: { id: `user-${userId}` },
          update: {
            isRunning: true,
            progress: 0,
            currentOperation: 'Starting incremental sync...',
            lastError: null,
            updatedAt: new Date(),
          },
          create: {
            id: `user-${userId}`,
            isRunning: true,
            progress: 0,
            currentOperation: 'Starting incremental sync...',
          },
        })
      );

      // Get user's player ID from database
      const user = await resilientDB.execute((db) =>
        db.user.findUnique({
          where: { id: userId },
          include: {
            players: {
              take: 1, // Get first player (users typically have one player profile)
            },
          },
        })
      );

      if (!user || !user.players || user.players.length === 0) {
        throw new Error(`No player profile found for user ${userId}`);
      }

      const playerId = user.players[0].gomafiaId;
      console.log(
        `[Incremental Sync] Found player profile: ${playerId} for user ${userId}`
      );

      // Get all tournaments for this user
      const tournaments = await resilientDB.execute((db) =>
        db.tournament.findMany({
          where: {
            games: {
              some: {
                participations: {
                  some: {
                    player: {
                      userId: userId,
                    },
                  },
                },
              },
            },
          },
          select: { id: true, gomafiaId: true, name: true },
        })
      );

      console.log(
        `[Incremental Sync] Found ${tournaments.length} tournaments to check for new games`
      );

      // Import games phase with incremental filtering
      const { GamesPhase } = await import('./phases/games-phase');
      const _gamesPhase = new GamesPhase(this);

      // We need to modify the games phase to support incremental sync
      // For now, we'll use a custom approach: scrape games and filter by date
      const browser = this.browser;
      const page = await browser.newPage();

      try {
        // Block unnecessary resources for performance
        await page.route('**/*', (route) => {
          const resourceType = route.request().resourceType();
          const url = route.request().url();
          if (
            ['image', 'font', 'media', 'stylesheet'].includes(resourceType) ||
            url.includes('analytics') ||
            url.includes('google-analytics') ||
            url.includes('gtag')
          ) {
            route.abort();
          } else {
            route.continue();
          }
        });

        const { TournamentGamesScraper } = await import(
          '@/lib/gomafia/scrapers/tournament-games-scraper'
        );
        const scraper = new TournamentGamesScraper(page);

        // Process each tournament
        for (let i = 0; i < tournaments.length; i++) {
          const tournament = tournaments[i];
          if (!tournament.gomafiaId) continue;

          // Check for cancellation
          if (this.isCancelled()) {
            throw new Error('Sync cancelled');
          }

          // Update progress
          const progress = Math.floor((i / tournaments.length) * 100);
          await resilientDB.execute((db) =>
            db.syncStatus.update({
              where: { id: `user-${userId}` },
              data: {
                progress,
                currentOperation: `Checking tournament: ${tournament.name}`,
                updatedAt: new Date(),
              },
            })
          );

          try {
            // Scrape games from tournament
            const games = await scraper.scrapeGames(tournament.gomafiaId);

            // Filter games: only import games with date > lastSyncAt
            const newGames = games.filter((game: GameRawData) => {
              const gameDate = new Date(game.date);
              return gameDate > lastSyncAt;
            });

            console.log(
              `[Incremental Sync] Tournament ${tournament.name}: ${newGames.length} new games out of ${games.length} total`
            );

            // Import new games
            for (const gameData of newGames) {
              try {
                // Validate game data
                const isValid = await this.validateGameData(gameData);
                if (!isValid) {
                  this.recordInvalidRecord('game', 'Invalid game data', {
                    gomafiaId: gameData.gomafiaId,
                  });
                  errors++;
                  continue;
                }

                // Check if game already exists
                const existingGame = await resilientDB.execute((db) =>
                  db.game.findUnique({
                    where: { gomafiaId: gameData.gomafiaId },
                  })
                );

                if (existingGame) {
                  // Game exists - check if data changed
                  const gameDate = new Date(gameData.date);
                  const existingDate = existingGame.date;

                  // Update if date changed or if it's a new game (date > lastSyncAt)
                  if (
                    gameDate.getTime() !== existingDate.getTime() ||
                    gameDate > lastSyncAt
                  ) {
                    await resilientDB.execute((db) =>
                      db.game.update({
                        where: { gomafiaId: gameData.gomafiaId },
                        data: {
                          date: gameDate,
                          winnerTeam: gameData.winnerTeam || null,
                          status: gameData.status || 'COMPLETED',
                          lastSyncAt: new Date(),
                          syncStatus: 'SYNCED',
                        },
                      })
                    );
                    gamesUpdated++;
                    this.recordValidRecord('game');
                  }
                } else {
                  // New game - import it
                  // Get system user for game creation
                  const _systemUserId = await this.getSystemUser();

                  await resilientDB.execute((db) =>
                    db.game.create({
                      data: {
                        gomafiaId: gameData.gomafiaId,
                        tournamentId: tournament.id,
                        date: new Date(gameData.date),
                        winnerTeam: gameData.winnerTeam || null,
                        status: gameData.status || 'COMPLETED',
                        lastSyncAt: new Date(),
                        syncStatus: 'SYNCED',
                        // Note: Game participations would need to be imported separately
                        // This is a simplified version - full implementation would import participations
                      },
                    })
                  );
                  gamesImported++;
                  this.recordValidRecord('game');
                }

                // Rate limiting
                await this.rateLimiter.wait();
              } catch (error) {
                console.error(
                  `[Incremental Sync] Error importing game ${gameData.gomafiaId}:`,
                  error
                );
                errors++;
                this.logError(
                  error instanceof Error ? error : new Error('Unknown error'),
                  'GAME_IMPORT_FAILED',
                  {
                    entityId: gameData.gomafiaId,
                    entityType: 'game',
                  }
                );
              }
            }
          } catch (error) {
            console.error(
              `[Incremental Sync] Error processing tournament ${tournament.name}:`,
              error
            );
            errors++;
          }
        }

        // Update lastSyncAt in User model
        await resilientDB.execute((db) =>
          db.user.update({
            where: { id: userId },
            data: {
              lastSyncAt: new Date(),
            },
          })
        );

        // Update sync status
        await resilientDB.execute((db) =>
          db.syncStatus.update({
            where: { id: `user-${userId}` },
            data: {
              isRunning: false,
              progress: 100,
              currentOperation: null,
              lastSyncTime: new Date(),
              lastSyncType: 'INCREMENTAL',
              updatedAt: new Date(),
            },
          })
        );

        // Update sync log
        await resilientDB.execute((db) =>
          db.syncLog.update({
            where: { id: syncLog.id },
            data: {
              status: 'COMPLETED',
              endTime: new Date(),
              recordsProcessed: gamesImported + gamesUpdated,
              errors:
                errors > 0
                  ? ({
                      message: 'Incremental sync completed with errors',
                      gamesImported,
                      gamesUpdated,
                      errors,
                    } as Prisma.InputJsonValue)
                  : undefined,
            },
          })
        );

        console.log(
          `[Incremental Sync] Completed: ${gamesImported} imported, ${gamesUpdated} updated, ${errors} errors`
        );

        return {
          gamesImported,
          gamesUpdated,
          errors,
          success: true,
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      console.error('[Incremental Sync] Failed:', error);

      // Update sync status with error
      await resilientDB.execute((db) =>
        db.syncStatus.update({
          where: { id: `user-${userId}` },
          data: {
            isRunning: false,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date(),
          },
        })
      );

      // Update sync log with failure
      const syncLogId = this.currentSyncLogId;
      if (syncLogId) {
        await resilientDB.execute((db) =>
          db.syncLog.update({
            where: { id: syncLogId },
            data: {
              status: 'FAILED',
              endTime: new Date(),
              errors: {
                message:
                  error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
              } as Prisma.InputJsonValue,
            },
          })
        );
      }

      return {
        gamesImported,
        gamesUpdated,
        errors,
        success: false,
      };
    }
  }
}
