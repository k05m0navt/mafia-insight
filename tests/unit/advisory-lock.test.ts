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

  it('should support user-specific locks', async () => {
    const userId1 = 'test-user-1';
    const userId2 = 'test-user-2';

    // Create second lock manager with separate DB connection
    const lockManager2 = new AdvisoryLockManager(db2);

    // User 1 acquires lock
    const user1Acquire = await lockManager.acquireLock(userId1);
    expect(user1Acquire).toBe(true);

    // User 2 should be able to acquire lock (different user)
    const user2Acquire = await lockManager2.acquireLock(userId2);
    expect(user2Acquire).toBe(true);

    // User 1 should not be able to acquire another lock for same user
    const user1SecondAcquire = await lockManager2.acquireLock(userId1);
    expect(user1SecondAcquire).toBe(false);

    // Release both locks
    await lockManager.releaseLock(userId1);
    await lockManager2.releaseLock(userId2);
  });

  it('should track lock age', async () => {
    const userId = 'test-user-1';

    // Acquire lock
    const acquired = await lockManager.acquireLock(userId);
    expect(acquired).toBe(true);

    // Get lock age
    const age = lockManager.getLockAge(userId);
    expect(age).not.toBeNull();
    expect(age).toBeGreaterThanOrEqual(0);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Age should have increased
    const ageAfter = lockManager.getLockAge(userId);
    expect(ageAfter).toBeGreaterThan(age!);

    // Release lock
    await lockManager.releaseLock(userId);

    // Age should be null after release
    const ageAfterRelease = lockManager.getLockAge(userId);
    expect(ageAfterRelease).toBeNull();
  });

  it('should check if lock is held', async () => {
    const userId = 'test-user-1';

    // Initially, lock should not be held
    expect(lockManager.isLockHeld(userId)).toBe(false);

    // Acquire lock
    const acquired = await lockManager.acquireLock(userId);
    expect(acquired).toBe(true);

    // Lock should be held
    expect(lockManager.isLockHeld(userId)).toBe(true);

    // Release lock
    await lockManager.releaseLock(userId);

    // Lock should no longer be held
    expect(lockManager.isLockHeld(userId)).toBe(false);
  });

  it('should cleanup stale locks', async () => {
    const userId = 'test-user-1';

    // Acquire lock
    const acquired = await lockManager.acquireLock(userId);
    expect(acquired).toBe(true);

    // Cleanup should not affect non-stale locks
    await lockManager.cleanupStaleLock(userId);
    expect(lockManager.isLockHeld(userId)).toBe(true);

    // Release normally
    await lockManager.releaseLock(userId);
  });
});
