import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendSyncCompletionNotification } from '@/lib/notifications/sync-notifications';
import { createTestUser } from '../../setup';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db-resilient', () => ({
  resilientDB: {
    execute: vi.fn((fn) => fn({})),
  },
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'email-123' }),
    },
  })),
}));

describe('Sync Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear environment variable
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should send email notification when sync completes successfully', async () => {
    const { resilientDB } = await import('@/lib/db-resilient');
    const { Resend } = await import('resend');

    const mockUser = await createTestUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
      const mockDb = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            emailNotifications: true,
          }),
        },
      };
      return fn(mockDb as any);
    });

    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.RESEND_FROM_EMAIL = 'noreply@test.com';

    const notificationData = {
      userId: mockUser.id,
      success: true,
      gamesImported: 10,
      gamesUpdated: 5,
      errors: 0,
      syncType: 'INCREMENTAL' as const,
      startTime: new Date('2024-01-01T00:00:00Z'),
      endTime: new Date('2024-01-01T01:00:00Z'),
    };

    await sendSyncCompletionNotification(notificationData);

    expect(Resend).toHaveBeenCalled();
    const resendInstance = new Resend('test-api-key');
    expect(resendInstance.emails.send).toHaveBeenCalled();
  });

  it('should respect emailNotifications preference', async () => {
    const { resilientDB } = await import('@/lib/db-resilient');
    const { Resend } = await import('resend');

    const mockUser = await createTestUser();

    vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
      const mockDb = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            emailNotifications: false, // Disabled
          }),
        },
      };
      return fn(mockDb as any);
    });

    process.env.RESEND_API_KEY = 'test-api-key';

    const notificationData = {
      userId: mockUser.id,
      success: true,
      gamesImported: 10,
      gamesUpdated: 5,
      errors: 0,
      syncType: 'INCREMENTAL' as const,
      startTime: new Date('2024-01-01T00:00:00Z'),
      endTime: new Date('2024-01-01T01:00:00Z'),
    };

    await sendSyncCompletionNotification(notificationData);

    // Should not send email
    expect(Resend).not.toHaveBeenCalled();
  });

  it('should log email when RESEND_API_KEY is not configured', async () => {
    const { resilientDB } = await import('@/lib/db-resilient');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const mockUser = await createTestUser();

    vi.mocked(resilientDB.execute).mockImplementation(async (fn) => {
      const mockDb = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            emailNotifications: true,
          }),
        },
      };
      return fn(mockDb as any);
    });

    delete process.env.RESEND_API_KEY;

    const notificationData = {
      userId: mockUser.id,
      success: true,
      gamesImported: 10,
      gamesUpdated: 5,
      errors: 0,
      syncType: 'INCREMENTAL' as const,
      startTime: new Date('2024-01-01T00:00:00Z'),
      endTime: new Date('2024-01-01T01:00:00Z'),
    };

    await sendSyncCompletionNotification(notificationData);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Sync Notification] Email notification')
    );

    consoleSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    const { resilientDB } = await import('@/lib/db-resilient');
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    vi.mocked(resilientDB.execute).mockRejectedValue(
      new Error('Database error')
    );

    const notificationData = {
      userId: 'user-123',
      success: false,
      gamesImported: 0,
      gamesUpdated: 0,
      errors: 1,
      syncType: 'INCREMENTAL' as const,
      startTime: new Date('2024-01-01T00:00:00Z'),
      endTime: new Date('2024-01-01T01:00:00Z'),
    };

    // Should not throw
    await expect(
      sendSyncCompletionNotification(notificationData)
    ).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
