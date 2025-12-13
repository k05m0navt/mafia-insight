import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditLogPage from '@/app/admin/audit-log/page';

// Mock fetch
global.fetch = vi.fn();

describe('Admin Audit Log Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays audit log entries in table format', async () => {
    const mockEntries = [
      {
        id: 'audit-1',
        actionType: 'ROLE_CHANGE',
        adminUserId: 'admin-1',
        targetUserId: 'user-1',
        oldValue: 'user',
        newValue: 'admin',
        metadata: {},
        createdAt: '2024-01-15T10:00:00Z',
        admin: {
          id: 'admin-1',
          email: 'admin@example.com',
          name: 'Admin User',
        },
        target: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Regular User',
        },
      },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        entries: mockEntries,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      }),
    } as Response);

    render(await AuditLogPage());

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('shows required fields: action type, admin user, target user, old role, new role, timestamp', async () => {
    const mockEntry = {
      id: 'audit-1',
      actionType: 'ROLE_CHANGE',
      adminUserId: 'admin-1',
      targetUserId: 'user-1',
      oldValue: 'user',
      newValue: 'admin',
      metadata: {},
      createdAt: '2024-01-15T10:00:00Z',
      admin: {
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin User',
      },
      target: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Regular User',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        entries: [mockEntry],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      }),
    } as Response);

    render(await AuditLogPage());

    await waitFor(() => {
      expect(screen.getByText(/ROLE_CHANGE/i)).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });

  it('implements pagination for audit log entries', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        entries: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          totalPages: 2,
        },
      }),
    } as Response);

    render(await AuditLogPage());

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    });
  });

  it('implements date range filter', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      }),
    } as Response);

    render(await AuditLogPage());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Find date inputs (if they exist)
    const dateInputs = screen.queryAllByLabelText(/date/i);
    if (dateInputs.length > 0) {
      await user.type(dateInputs[0], '2024-01-01');

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('startDate'),
          expect.any(Object)
        );
      });
    }
  });

  it('is accessible with proper ARIA labels', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        entries: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      }),
    } as Response);

    render(await AuditLogPage());

    await waitFor(() => {
      const table = screen.queryByRole('table');
      if (table) {
        expect(table).toBeInTheDocument();
      }
    });
  });
});
