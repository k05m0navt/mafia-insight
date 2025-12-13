import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import * as nextAuth from 'next-auth/react';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

describe('OAuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variables
    process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = 'github-client-id';
  });

  it('should render Google OAuth button', () => {
    render(<OAuthButtons />);

    const googleButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    expect(googleButton).toBeInTheDocument();
  });

  it('should render GitHub OAuth button when configured', () => {
    render(<OAuthButtons />);

    const githubButton = screen.getByRole('button', {
      name: /sign in with github/i,
    });
    expect(githubButton).toBeInTheDocument();
  });

  it('should not render GitHub button when not configured', () => {
    delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

    render(<OAuthButtons />);

    const githubButton = screen.queryByRole('button', {
      name: /sign in with github/i,
    });
    expect(githubButton).not.toBeInTheDocument();
  });

  it('should call signIn with correct provider when button clicked', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(nextAuth.signIn);
    mockSignIn.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: null,
    });

    render(<OAuthButtons />);

    const googleButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    await user.click(googleButton);

    expect(mockSignIn).toHaveBeenCalledWith('google', {
      callbackUrl: '/players',
      redirect: true,
    });
  });

  it('should show loading state during OAuth flow', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(nextAuth.signIn);
    // Simulate async signIn
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ ok: true, error: null, status: 200, url: null }),
            100
          );
        }) as any
    );

    render(<OAuthButtons />);

    const googleButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    await user.click(googleButton);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    });

    expect(googleButton).toBeDisabled();
  });

  it('should disable all buttons when one is loading', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(nextAuth.signIn);
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ ok: true, error: null, status: 200, url: null }),
            100
          );
        }) as any
    );

    render(<OAuthButtons />);

    const googleButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    const githubButton = screen.getByRole('button', {
      name: /sign in with github/i,
    });

    await user.click(googleButton);

    // Both buttons should be disabled during loading
    await waitFor(() => {
      expect(googleButton).toBeDisabled();
      expect(githubButton).toBeDisabled();
    });
  });

  it('should call onSuccess callback when signIn succeeds', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const mockSignIn = vi.mocked(nextAuth.signIn);
    mockSignIn.mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: null,
    });

    render(<OAuthButtons onSuccess={onSuccess} />);

    const googleButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    await user.click(googleButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should have proper ARIA labels', () => {
    render(<OAuthButtons />);

    const googleButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    expect(googleButton).toHaveAttribute('aria-label', 'Sign in with Google');

    const githubButton = screen.getByRole('button', {
      name: /sign in with github/i,
    });
    expect(githubButton).toHaveAttribute('aria-label', 'Sign in with GitHub');
  });

  it('should have proper role and group structure', () => {
    const { container } = render(<OAuthButtons />);

    const group = container.querySelector('[role="group"]');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute(
      'aria-label',
      'Social authentication options'
    );
  });

  it('should display provider icons', () => {
    render(<OAuthButtons />);

    // Check for SVG icons (Google and GitHub logos)
    const svgs = screen.getAllByRole('img', { hidden: true });
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should apply custom className', () => {
    const { container } = render(<OAuthButtons className="custom-class" />);

    const group = container.querySelector('[role="group"]');
    expect(group).toHaveClass('custom-class');
  });

  it('should handle signIn errors gracefully', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(nextAuth.signIn);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockSignIn.mockRejectedValue(new Error('OAuth error'));

    render(<OAuthButtons />);

    const googleButton = screen.getByRole('button', {
      name: /sign in with google/i,
    });
    await user.click(googleButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('OAuth'),
        expect.stringContaining('error')
      );
    });

    // Button should be re-enabled after error
    await waitFor(() => {
      expect(googleButton).not.toBeDisabled();
    });

    consoleError.mockRestore();
  });
});
