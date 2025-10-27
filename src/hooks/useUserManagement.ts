'use client';

import { useState, useCallback } from 'react';
import type { UserRole } from '@/types/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

interface UseUserManagementReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: UserFilters;
  setFilters: (filters: Partial<UserFilters>) => void;
  fetchUsers: () => Promise<void>;
  createUser: (userData: {
    email: string;
    name: string;
    role: UserRole;
  }) => Promise<User | null>;
  updateUser: (
    userId: string,
    updates: {
      name?: string;
      role?: UserRole;
      isActive?: boolean;
    }
  ) => Promise<User | null>;
  deleteUser: (userId: string) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
}

export const useUserManagement = (
  initialFilters: UserFilters = {}
): UseUserManagementReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFiltersState] = useState<UserFilters>({
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  const buildQueryString = useCallback((filters: UserFilters): string => {
    const params = new URLSearchParams();

    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.search) params.set('search', filters.search);
    if (filters.role) params.set('role', filters.role);
    if (filters.isActive !== undefined)
      params.set('isActive', filters.isActive.toString());

    return params.toString();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryString = buildQueryString(filters);
      const response = await fetch(`/api/users?${queryString}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: UserListResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, buildQueryString]);

  const createUser = useCallback(
    async (userData: {
      email: string;
      name: string;
      role: UserRole;
    }): Promise<User | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create user');
        }

        const user = await response.json();

        // Refresh the users list
        await fetchUsers();

        return user;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers]
  );

  const updateUser = useCallback(
    async (
      userId: string,
      updates: {
        name?: string;
        role?: UserRole;
        isActive?: boolean;
      }
    ): Promise<User | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update user');
        }

        const user = await response.json();

        // Update the user in the local state
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? user : u))
        );

        return user;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Remove the user from the local state
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  const setFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  return {
    users,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers,
  };
};
