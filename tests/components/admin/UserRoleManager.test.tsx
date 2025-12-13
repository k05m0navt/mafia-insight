import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserRoleManager } from '@/components/admin/UserRoleManager';
import { useToast } from '@/components/hooks/use-toast';

// Mock toast hook
vi.mock('@/components/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('UserRoleManager', () => {
  const mockToast = vi.fn();
  const mockOnRoleUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    } as any);
  });

  it('displays current user role', () => {
    render(
      <UserRoleManager
        userId="user-123"
        currentRole="user"
        onRoleUpdate={mockOnRoleUpdate}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('user');
  });

  it('shows confirmation dialog when role is changed', async () => {
    const user = userEvent.setup();
    render(
      <UserRoleManager
        userId="user-123"
        currentRole="user"
        onRoleUpdate={mockOnRoleUpdate}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    // Select admin role
    const adminOption = screen.getByText('Admin');
    await user.click(adminOption);

    // Dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Confirm Role Change')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Are you sure you want to change/i)
    ).toBeInTheDocument();
  });

  it('updates role successfully and shows success toast', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 'user-123', role: 'admin' },
        message: 'User role updated successfully',
      }),
    } as Response);

    render(
      <UserRoleManager
        userId="user-123"
        currentRole="user"
        onRoleUpdate={mockOnRoleUpdate}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    const adminOption = screen.getByText('Admin');
    await user.click(adminOption);

    // Confirm in dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Role Change')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/users/user-123/role',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ role: 'admin' }),
        })
      );
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Role Updated',
        description: expect.stringContaining('admin'),
      })
    );

    expect(mockOnRoleUpdate).toHaveBeenCalled();
  });

  it('shows error toast when role update fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Cannot remove the last administrator',
      }),
    } as Response);

    render(
      <UserRoleManager
        userId="user-123"
        currentRole="admin"
        onRoleUpdate={mockOnRoleUpdate}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    const userOption = screen.getByText('User');
    await user.click(userOption);

    // Confirm in dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Role Change')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Update Failed',
          variant: 'destructive',
          description: 'Cannot remove the last administrator',
        })
      );
    });
  });

  it('displays validation error when trying to remove last admin', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Cannot remove the last administrator',
        code: 'VALIDATION_ERROR',
        message:
          'Cannot remove the last administrator. At least one admin must remain.',
      }),
    } as Response);

    render(
      <UserRoleManager
        userId="admin-123"
        currentRole="admin"
        onRoleUpdate={mockOnRoleUpdate}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    const userOption = screen.getByText('User');
    await user.click(userOption);

    await waitFor(() => {
      expect(screen.getByText('Confirm Role Change')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Update Failed',
          description: expect.stringContaining(
            'Cannot remove the last administrator'
          ),
        })
      );
    });
  });

  it('shows loading state during update', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  user: { id: 'user-123', role: 'admin' },
                }),
              } as Response),
            100
          );
        })
    );

    render(
      <UserRoleManager
        userId="user-123"
        currentRole="user"
        onRoleUpdate={mockOnRoleUpdate}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    const adminOption = screen.getByText('Admin');
    await user.click(adminOption);

    await waitFor(() => {
      expect(screen.getByText('Confirm Role Change')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });

    expect(confirmButton).toBeDisabled();
  });

  it('cancels role change when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <UserRoleManager
        userId="user-123"
        currentRole="user"
        onRoleUpdate={mockOnRoleUpdate}
      />
    );

    const select = screen.getByRole('combobox');
    await user.click(select);

    const adminOption = screen.getByText('Admin');
    await user.click(adminOption);

    await waitFor(() => {
      expect(screen.getByText('Confirm Role Change')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Confirm Role Change')).not.toBeInTheDocument();
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('is accessible with proper ARIA labels', () => {
    render(
      <UserRoleManager
        userId="user-123"
        currentRole="user"
        onRoleUpdate={mockOnRoleUpdate}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveAttribute('aria-expanded');
  });
});
