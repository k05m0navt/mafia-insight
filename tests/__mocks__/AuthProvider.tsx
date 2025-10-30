import React from 'react';
import { vi } from 'vitest';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="auth-provider">{children}</div>;
};

export const useAuth = () => ({
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  isAuthenticated: false,
  isLoading: false,
});
