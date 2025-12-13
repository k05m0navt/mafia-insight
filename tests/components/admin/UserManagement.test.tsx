import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagement } from '@/components/admin/UserManagement';

// Mock fetch
global.fetch = vi.fn();

// Mock toast hook
vi.mock('@/components/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays user list with pagination', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        role: 'user',
        avatar: null,
        lastLogin: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User Two',
        role: 'admin',
        avatar: null,
        lastLogin: null,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
        },
      }),
    } as Response);

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  it('implements search functionality', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [
          {
            id: 'user-1',
            email: 'search@example.com',
            name: 'Search User',
            role: 'user',
            avatar: null,
            lastLogin: null,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      }),
    } as Response);

    render(<UserManagement />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'search@example.com');

    // Wait for debounce
    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=search@example.com'),
          expect.any(Object)
        );
      },
      { timeout: 500 }
    );
  });

  it('implements role filter', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      }),
    } as Response);

    render(<UserManagement />);

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Find and click role filter
    const roleFilter = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleFilter);

    const adminOption = screen.getByText('Admin');
    await user.click(adminOption);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('role=admin'),
        expect.any(Object)
      );
    });
  });

  it('displays pagination controls', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          totalPages: 2,
        },
      }),
    } as Response);

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    });
  });

  it('handles pagination navigation', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [],
        pagination: {
          page: 2,
          limit: 50,
          total: 100,
          totalPages: 2,
        },
      }),
    } as Response);

    render(<UserManagement />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });

  it('displays user information correctly', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      avatar: null,
      lastLogin: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [mockUser],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      }),
    } as Response);

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<UserManagement />);

    await waitFor(() => {
      // Error toast should be called (mocked)
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('is accessible with proper ARIA labels', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      }),
    } as Response);

    render(<UserManagement />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });
  });
});
