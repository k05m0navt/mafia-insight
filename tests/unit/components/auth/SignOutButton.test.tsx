import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SignOutButton } from '@/components/auth/SignOutButton';

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    logout: jest.fn().mockResolvedValue(undefined),
    authState: { isLoading: false },
  }),
}));

describe('SignOutButton', () => {
  it('renders a sign out button', () => {
    render(<SignOutButton />);
    expect(
      screen.getByRole('button', { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it('calls logout and onSignOut when clicked', async () => {
    const onSignOut = jest.fn();
    const logoutMock = jest.fn().mockResolvedValue(undefined);

    (
      jest.requireMock('@/hooks/useAuth') as jest.MockedFunction<
        () => { logout: jest.Mock; authState: { isLoading: boolean } }
      >
    ).useAuth = () => ({
      logout: logoutMock,
      authState: { isLoading: false },
    });

    render(<SignOutButton onSignOut={onSignOut} />);

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    // Wait a tick for async handler
    await Promise.resolve();

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when auth is loading', () => {
    (
      jest.requireMock('@/hooks/useAuth') as jest.MockedFunction<
        () => { logout: jest.Mock; authState: { isLoading: boolean } }
      >
    ).useAuth = () => ({
      logout: jest.fn(),
      authState: { isLoading: true },
    });

    render(<SignOutButton />);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/signing out/i)).toBeInTheDocument();
  });
});
