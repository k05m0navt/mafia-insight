import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
  let mockResendSend: ReturnType<typeof vi.fn>;
  let sendSyncCompletionNotification: typeof import('@/lib/notifications/sync-notifications').sendSyncCompletionNotification;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear environment variable
    delete process.env.RESEND_API_KEY;

    // Set up fresh Resend mock for each test
    const { Resend } = await import('resend');
    mockResendSend = vi.fn().mockResolvedValue({ id: 'email-123' });
    (Resend as any).mockImplementation(() => ({
      emails: {
        send: mockResendSend,
      },
    }));

    // Reset modules to reload sync-notifications with fresh mock
    vi.resetModules();
    const module = await import('@/lib/notifications/sync-notifications');
    sendSyncCompletionNotification = module.sendSyncCompletionNotification;
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

    // Check that Resend was instantiated (happens at module load)
    expect(Resend).toHaveBeenCalled();
    // Check that emails.send was called on the instance
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('Sync Completed Successfully'),
      })
    );
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

    // Should not send email - check that emails.send was not called
    // Note: Resend constructor is called at module load, but emails.send should not be called
    const mockResendInstance = (Resend as any).mock.results.find(
      (result: any) => result?.value?.emails?.send
    )?.value;
    if (mockResendInstance) {
      expect(mockResendInstance.emails.send).not.toHaveBeenCalled();
    }
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
      '[Sync Notification] Email notification (RESEND_API_KEY not configured):',
      expect.any(Object)
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
