import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import AuthErrorPage from '@/app/(auth)/auth/error/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('AuthErrorPage', () => {
  it('should render default error message when no error param', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: () => null,
    } as any);

    render(<AuthErrorPage />);

    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(
      screen.getByText(
        'An error occurred during authentication. Please try again or use email and password to sign in.'
      )
    ).toBeInTheDocument();
  });

  it('should render AccessDenied error message', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: (key: string) => (key === 'error' ? 'AccessDenied' : null),
    } as any);

    render(<AuthErrorPage />);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You did not grant the necessary permissions. Please try again and authorize the application.'
      )
    ).toBeInTheDocument();
  });

  it('should render Configuration error message', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: (key: string) => (key === 'error' ? 'Configuration' : null),
    } as any);

    render(<AuthErrorPage />);

    expect(screen.getByText('Configuration Error')).toBeInTheDocument();
    expect(
      screen.getByText(
        'There is a problem with the server configuration. Please contact support.'
      )
    ).toBeInTheDocument();
  });

  it('should render Verification error message', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: (key: string) => (key === 'error' ? 'Verification' : null),
    } as any);

    render(<AuthErrorPage />);

    expect(screen.getByText('Verification Error')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The verification token has expired or has already been used. Please try signing in again.'
      )
    ).toBeInTheDocument();
  });

  it('should render Try Again button linking to login', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: () => null,
    } as any);

    render(<AuthErrorPage />);

    const tryAgainLink = screen.getByText('Try Again').closest('a');
    expect(tryAgainLink).toHaveAttribute('href', '/login');
  });

  it('should render Go Home button linking to home', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: () => null,
    } as any);

    render(<AuthErrorPage />);

    const goHomeLink = screen.getByText('Go Home').closest('a');
    expect(goHomeLink).toHaveAttribute('href', '/');
  });

  it('should have proper ARIA labels for accessibility', () => {
    vi.mocked(useSearchParams).mockReturnValue({
      get: () => null,
    } as any);

    render(<AuthErrorPage />);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-label', 'Authentication error page');
  });
});
