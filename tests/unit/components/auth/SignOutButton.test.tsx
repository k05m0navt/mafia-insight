import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { SignOutButton } from '@/components/auth/SignOutButton';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  const defaultLogout = vi.fn().mockResolvedValue(undefined);
  mockUseAuth.mockReturnValue({
    logout: defaultLogout,
    isLoading: false,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SignOutButton', () => {
  it('renders a sign out button', () => {
    render(<SignOutButton />);
    expect(
      screen.getByRole('button', { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it('calls logout and onSignOut when clicked', async () => {
    const onSignOut = vi.fn();
    const logoutMock = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      logout: logoutMock,
      isLoading: false,
    });

    render(<SignOutButton onSignOut={onSignOut} />);

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1);
      expect(onSignOut).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      logout: vi.fn(),
      isLoading: true,
    });

    render(<SignOutButton />);
    expect(screen.getByRole('button', { name: /signing out/i })).toBeDisabled();
  });
});
