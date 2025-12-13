import { PrismaClient } from '@prisma/client';
import { resilientDB } from '@/lib/db-resilient';

// Unique lock ID for gomafia import feature
const IMPORT_LOCK_ID = 123456789;

export class AdvisoryLockManager {
  constructor(private db: PrismaClient) {}

  /**
   * Try to acquire the import advisory lock.
   * @param userId Optional user ID for user-specific locks (allows different users to import simultaneously)
   * @returns true if lock was acquired, false if already held by another process
   */
  async acquireLock(userId?: string): Promise<boolean> {
    // If userId provided, use user-specific lock key (allows concurrent imports for different users)
    // Otherwise, use system-wide lock
    const lockId = userId
      ? IMPORT_LOCK_ID + parseInt(userId.slice(0, 8), 16)
      : IMPORT_LOCK_ID;

    const result = await resilientDB.execute(
      (db) => db.$queryRaw<[{ pg_try_advisory_lock: boolean }]>`
        SELECT pg_try_advisory_lock(${lockId})
      `
    );
    return result[0].pg_try_advisory_lock;
  }

  /**
   * Release the import advisory lock.
   * @param userId Optional user ID for user-specific locks
   */
  async releaseLock(userId?: string): Promise<void> {
    const lockId = userId
      ? IMPORT_LOCK_ID + parseInt(userId.slice(0, 8), 16)
      : IMPORT_LOCK_ID;

    await resilientDB.execute(
      (db) => db.$queryRaw`
        SELECT pg_advisory_unlock(${lockId})
      `
    );
  }

  /**
   * Execute a function with lock protection.
   * Acquires the lock, executes the function, and releases the lock (even if function throws).
   * @param fn Function to execute with lock protection
   * @throws Error if lock cannot be acquired
   * @returns Result of the function execution
   */
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const acquired = await this.acquireLock();
    if (!acquired) {
      throw new Error('Import operation already in progress');
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock();
    }
  }
}
