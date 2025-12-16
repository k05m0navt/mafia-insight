import { PrismaClient } from '@prisma/client';
import { resilientDB } from '@/lib/db-resilient';

// Unique lock ID for gomafia import feature
const IMPORT_LOCK_ID = 123456789;

// Maximum lock duration: 12 hours (prevents stale locks from crashed processes)
const MAX_LOCK_DURATION_MS = 12 * 60 * 60 * 1000;

interface LockMetadata {
  userId?: string;
  acquiredAt: Date;
  lockId: number;
}

export class AdvisoryLockManager {
  private activeLocks: Map<string, LockMetadata> = new Map();

  constructor(private db: PrismaClient) {}

  /**
   * Get lock key for a user ID.
   * @param userId Optional user ID for user-specific locks
   * @returns Lock ID number
   */
  private getLockId(userId?: string): number {
    if (!userId) {
      return IMPORT_LOCK_ID;
    }

    // Generate a numeric hash from userId string
    // Use a simple hash function to convert string to number
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use absolute value and modulo to ensure positive number
    // Add to base lock ID, using modulo to keep it within reasonable range
    return IMPORT_LOCK_ID + Math.abs(hash % 1000000);
  }

  /**
   * Get lock key string for tracking.
   * @param userId Optional user ID for user-specific locks
   * @returns Lock key string
   */
  private getLockKey(userId?: string): string {
    return userId ? `user-${userId}` : 'system';
  }

  /**
   * Check if a lock is stale (older than MAX_LOCK_DURATION_MS).
   * @param metadata Lock metadata
   * @returns True if lock is stale
   */
  private isLockStale(metadata: LockMetadata): boolean {
    const age = Date.now() - metadata.acquiredAt.getTime();
    return age > MAX_LOCK_DURATION_MS;
  }

  /**
   * Clean up stale locks for a specific user or system.
   * Attempts to release locks that are older than MAX_LOCK_DURATION_MS.
   *
   * **Note**: This method only cleans locks tracked in this instance's `activeLocks` Map.
   * For cross-instance stale lock detection (e.g., from crashed processes), the database
   * is checked automatically in `acquireLock()` via `pg_try_advisory_lock()`, which will
   * fail if another connection holds the lock. Stale locks from crashed processes are
   * automatically released by PostgreSQL when the connection terminates.
   *
   * @param userId Optional user ID for user-specific locks
   */
  async cleanupStaleLock(userId?: string): Promise<void> {
    const lockKey = this.getLockKey(userId);
    const metadata = this.activeLocks.get(lockKey);

    if (metadata && this.isLockStale(metadata)) {
      console.warn(
        `[AdvisoryLockManager] Detected stale lock for ${lockKey}, attempting cleanup...`
      );
      try {
        // Attempt to release the stale lock
        await this.releaseLock(userId);
        this.activeLocks.delete(lockKey);
        console.log(
          `[AdvisoryLockManager] Cleaned up stale lock for ${lockKey}`
        );
      } catch (error) {
        console.error(
          `[AdvisoryLockManager] Failed to cleanup stale lock for ${lockKey}:`,
          error
        );
        // Remove from tracking even if release fails (lock may have been released by connection termination)
        this.activeLocks.delete(lockKey);
      }
    }
  }

  /**
   * Try to acquire the import advisory lock.
   * Automatically cleans up stale locks before attempting acquisition.
   * @param userId Optional user ID for user-specific locks (allows different users to import simultaneously)
   * @returns true if lock was acquired, false if already held by another process
   */
  async acquireLock(userId?: string): Promise<boolean> {
    const lockKey = this.getLockKey(userId);
    const lockId = this.getLockId(userId);

    // Clean up stale lock before attempting acquisition
    await this.cleanupStaleLock(userId);

    const result = await resilientDB.execute(
      (db) => db.$queryRaw<[{ pg_try_advisory_lock: boolean }]>`
        SELECT pg_try_advisory_lock(${lockId})
      `
    );

    const acquired = result[0].pg_try_advisory_lock;

    if (acquired) {
      // Track lock metadata for timeout detection
      this.activeLocks.set(lockKey, {
        userId,
        acquiredAt: new Date(),
        lockId,
      });
    }

    return acquired;
  }

  /**
   * Release the import advisory lock.
   * @param userId Optional user ID for user-specific locks
   */
  async releaseLock(userId?: string): Promise<void> {
    const lockKey = this.getLockKey(userId);
    const lockId = this.getLockId(userId);

    try {
      await resilientDB.execute(
        (db) => db.$queryRaw`
          SELECT pg_advisory_unlock(${lockId})
        `
      );
    } finally {
      // Always remove from tracking, even if release fails
      this.activeLocks.delete(lockKey);
    }
  }

  /**
   * Execute a function with lock protection.
   * Acquires the lock, executes the function, and releases the lock (even if function throws).
   * @param fn Function to execute with lock protection
   * @param userId Optional user ID for user-specific locks
   * @throws Error if lock cannot be acquired
   * @returns Result of the function execution
   */
  async withLock<T>(fn: () => Promise<T>, userId?: string): Promise<T> {
    const acquired = await this.acquireLock(userId);
    if (!acquired) {
      throw new Error('Import operation already in progress');
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(userId);
    }
  }

  /**
   * Check if a lock is currently held (based on our tracking).
   * Note: This only tracks locks acquired through this instance.
   * For cross-instance detection, use acquireLock() which checks the database.
   * @param userId Optional user ID for user-specific locks
   * @returns True if lock is tracked as active
   */
  isLockHeld(userId?: string): boolean {
    const lockKey = this.getLockKey(userId);
    const metadata = this.activeLocks.get(lockKey);
    if (!metadata) {
      return false;
    }

    // Check if lock is stale
    if (this.isLockStale(metadata)) {
      // Remove stale lock from tracking
      // Note: We don't attempt database release here because:
      // 1. If the lock is stale in our tracking, it may have already been released
      // 2. The lock will be cleaned up on next acquireLock() attempt
      // 3. PostgreSQL automatically releases locks on connection termination
      this.activeLocks.delete(lockKey);
      return false;
    }

    return true;
  }

  /**
   * Get lock age in milliseconds.
   * @param userId Optional user ID for user-specific locks
   * @returns Lock age in milliseconds, or null if lock not held
   */
  getLockAge(userId?: string): number | null {
    const lockKey = this.getLockKey(userId);
    const metadata = this.activeLocks.get(lockKey);
    if (!metadata) {
      return null;
    }

    return Date.now() - metadata.acquiredAt.getTime();
  }
}
