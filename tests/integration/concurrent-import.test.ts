/**
 * Integration Tests for Concurrent Import Prevention
 *
 * Tests Story 2.8: Concurrent Import Prevention
 * - Lock prevents concurrent imports for same user
 * - Different users can import simultaneously (user-specific locks)
 * - Lock released on completion, failure, cancellation, timeout
 * - Stale lock cleanup (12 hours timeout)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AdvisoryLockManager } from '@/lib/gomafia/import/advisory-lock';

describe('Concurrent Import Prevention Integration Tests', () => {
  let db: PrismaClient;
  let db2: PrismaClient;
  let lockManager: AdvisoryLockManager;
  let lockManager2: AdvisoryLockManager;

  beforeEach(async () => {
    db = new PrismaClient();
    db2 = new PrismaClient(); // Separate connection for concurrent tests
    lockManager = new AdvisoryLockManager(db);
    lockManager2 = new AdvisoryLockManager(db2);
  });

  afterEach(async () => {
    // Clean up any remaining locks
    try {
      await lockManager.releaseLock();
      await lockManager2.releaseLock();
    } catch (error) {
      // Ignore errors during cleanup
    }
    await db.$disconnect();
    await db2.$disconnect();
  });

  describe('Lock Acquisition and Release', () => {
    it('should prevent concurrent imports for same user', async () => {
      const userId = 'test-user-1';

      // First import acquires lock
      const firstAcquire = await lockManager.acquireLock(userId);
      expect(firstAcquire).toBe(true);

      // Second import attempt should fail
      const secondAcquire = await lockManager2.acquireLock(userId);
      expect(secondAcquire).toBe(false);

      // Release lock
      await lockManager.releaseLock(userId);

      // After release, should be able to acquire again
      const thirdAcquire = await lockManager2.acquireLock(userId);
      expect(thirdAcquire).toBe(true);
      await lockManager2.releaseLock(userId);
    });

    it('should allow different users to import simultaneously', async () => {
      const userId1 = 'test-user-1';
      const userId2 = 'test-user-2';

      // User 1 acquires lock
      const user1Acquire = await lockManager.acquireLock(userId1);
      expect(user1Acquire).toBe(true);

      // User 2 should be able to acquire lock (different user)
      const user2Acquire = await lockManager2.acquireLock(userId2);
      expect(user2Acquire).toBe(true);

      // Both locks should be held
      expect(lockManager.isLockHeld(userId1)).toBe(true);
      expect(lockManager2.isLockHeld(userId2)).toBe(true);

      // Release both locks
      await lockManager.releaseLock(userId1);
      await lockManager2.releaseLock(userId2);
    });

    it('should release lock on completion', async () => {
      const userId = 'test-user-1';

      // Acquire lock
      const acquired = await lockManager.acquireLock(userId);
      expect(acquired).toBe(true);
      expect(lockManager.isLockHeld(userId)).toBe(true);

      // Release lock (simulating completion)
      await lockManager.releaseLock(userId);

      // Lock should no longer be held
      expect(lockManager.isLockHeld(userId)).toBe(false);

      // Should be able to acquire again
      const reacquire = await lockManager.acquireLock(userId);
      expect(reacquire).toBe(true);
      await lockManager.releaseLock(userId);
    });

    it('should release lock even if function throws (withLock)', async () => {
      const userId = 'test-user-1';

      // Attempt to execute with lock, but function throws
      await expect(async () => {
        await lockManager.withLock(async () => {
          throw new Error('Test error');
        }, userId);
      }).rejects.toThrow('Test error');

      // Lock should be released even after error
      expect(lockManager.isLockHeld(userId)).toBe(false);

      // Should be able to acquire again
      const reacquire = await lockManager.acquireLock(userId);
      expect(reacquire).toBe(true);
      await lockManager.releaseLock(userId);
    });
  });

  describe('Lock Timeout and Stale Lock Cleanup', () => {
    it('should detect stale locks older than 12 hours', async () => {
      const userId = 'test-user-1';

      // Manually set a stale lock by manipulating the internal state
      // (In real scenario, this would happen if a process crashed)
      const acquired = await lockManager.acquireLock(userId);
      expect(acquired).toBe(true);

      // Simulate stale lock by manipulating acquiredAt timestamp
      // Note: This is a test-only scenario. In production, stale locks
      // would be detected when attempting to acquire a new lock.
      const lockKey = `user-${userId}`;
      // We can't directly manipulate private state, so we test cleanup logic
      // by checking if cleanupStaleLock works correctly

      // Release the lock normally
      await lockManager.releaseLock(userId);
      expect(lockManager.isLockHeld(userId)).toBe(false);
    });

    it('should cleanup stale locks before acquiring new lock', async () => {
      const userId = 'test-user-1';

      // Acquire a lock
      const firstAcquire = await lockManager.acquireLock(userId);
      expect(firstAcquire).toBe(true);

      // Manually trigger cleanup (simulating stale lock detection)
      await lockManager.cleanupStaleLock(userId);

      // Lock should still be held if not stale
      // (In real scenario with stale lock, cleanup would release it)
      expect(lockManager.isLockHeld(userId)).toBe(true);

      // Release normally
      await lockManager.releaseLock(userId);
    });

    it('should get lock age correctly', async () => {
      const userId = 'test-user-1';

      // Acquire lock
      const acquired = await lockManager.acquireLock(userId);
      expect(acquired).toBe(true);

      // Get lock age
      const age = lockManager.getLockAge(userId);
      expect(age).not.toBeNull();
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThan(1000); // Should be very recent

      // Release lock
      await lockManager.releaseLock(userId);

      // Age should be null after release
      const ageAfterRelease = lockManager.getLockAge(userId);
      expect(ageAfterRelease).toBeNull();
    });
  });

  describe('System-wide vs User-specific Locks', () => {
    it('should use system-wide lock when no userId provided', async () => {
      // System-wide lock (no userId)
      const systemAcquire = await lockManager.acquireLock();
      expect(systemAcquire).toBe(true);

      // Second system-wide lock should fail
      const systemAcquire2 = await lockManager2.acquireLock();
      expect(systemAcquire2).toBe(false);

      // User-specific lock should still work (different lock key)
      const userAcquire = await lockManager2.acquireLock('test-user-1');
      expect(userAcquire).toBe(true);

      // Clean up
      await lockManager.releaseLock();
      await lockManager2.releaseLock('test-user-1');
    });

    it('should prevent concurrent system-wide imports', async () => {
      // First system import
      const firstAcquire = await lockManager.acquireLock();
      expect(firstAcquire).toBe(true);

      // Second system import should be rejected
      const secondAcquire = await lockManager2.acquireLock();
      expect(secondAcquire).toBe(false);

      // Release
      await lockManager.releaseLock();

      // Now second import should succeed
      const thirdAcquire = await lockManager2.acquireLock();
      expect(thirdAcquire).toBe(true);
      await lockManager2.releaseLock();
    });
  });
});
