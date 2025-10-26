import { PrismaClient } from '@prisma/client';
import { resilientDB } from '@/lib/db-resilient';

// Unique lock ID for gomafia import feature
const IMPORT_LOCK_ID = 123456789;

export class AdvisoryLockManager {
  constructor(private db: PrismaClient) {}

  /**
   * Try to acquire the import advisory lock.
   * @returns true if lock was acquired, false if already held by another process
   */
  async acquireLock(): Promise<boolean> {
    const result = await resilientDB.execute(
      (db) => db.$queryRaw<[{ pg_try_advisory_lock: boolean }]>`
        SELECT pg_try_advisory_lock(${IMPORT_LOCK_ID})
      `
    );
    return result[0].pg_try_advisory_lock;
  }

  /**
   * Release the import advisory lock.
   */
  async releaseLock(): Promise<void> {
    await resilientDB.execute(
      (db) => db.$queryRaw`
        SELECT pg_advisory_unlock(${IMPORT_LOCK_ID})
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
