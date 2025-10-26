import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';

describe('AdvisoryLockManager', () => {
  let db: PrismaClient;
  let db2: PrismaClient;
  let lockManager: AdvisoryLockManager;

  beforeEach(() => {
    db = new PrismaClient();
    db2 = new PrismaClient(); // Separate connection for concurrent lock tests
    lockManager = new AdvisoryLockManager(db);
  });

  afterEach(async () => {
    // Always release lock after each test
    try {
      await lockManager.releaseLock();
    } catch (error) {
      // Ignore errors during cleanup
    }
    await db.$disconnect();
    await db2.$disconnect();
  });

  it('should acquire lock when not held', async () => {
    const acquired = await lockManager.acquireLock();
    expect(acquired).toBe(true);
    await lockManager.releaseLock();
  });

  it('should fail to acquire when already held', async () => {
    const firstAcquire = await lockManager.acquireLock();
    expect(firstAcquire).toBe(true);

    // Create second lock manager with separate DB connection
    const secondLockManager = new AdvisoryLockManager(db2);
    const secondAcquire = await secondLockManager.acquireLock();
    expect(secondAcquire).toBe(false);

    await lockManager.releaseLock();
  });

  it('should execute function with lock protection', async () => {
    const result = await lockManager.withLock(async () => {
      return 'success';
    });
    expect(result).toBe('success');
  });

  it('should release lock even if function throws', async () => {
    await expect(async () => {
      await lockManager.withLock(async () => {
        throw new Error('Test error');
      });
    }).rejects.toThrow('Test error');

    // Verify lock is released
    const canAcquire = await lockManager.acquireLock();
    expect(canAcquire).toBe(true);
    await lockManager.releaseLock();
  });

  it('should throw error when lock cannot be acquired in withLock', async () => {
    await lockManager.acquireLock();

    const secondLockManager = new AdvisoryLockManager(db2);
    await expect(async () => {
      await secondLockManager.withLock(async () => {
        return 'should not reach here';
      });
    }).rejects.toThrow('Import operation already in progress');

    await lockManager.releaseLock();
  });

  it('should allow lock reacquisition after release', async () => {
    const firstAcquire = await lockManager.acquireLock();
    expect(firstAcquire).toBe(true);

    await lockManager.releaseLock();

    const secondAcquire = await lockManager.acquireLock();
    expect(secondAcquire).toBe(true);

    await lockManager.releaseLock();
  });
});
