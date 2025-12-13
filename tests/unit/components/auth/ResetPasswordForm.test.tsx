import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'token' ? 'valid-token-123' : null),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

const renderComponent = (token: string) =>
  render(<ResetPasswordForm token={token} />);

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockClear();
    mockPush.mockClear();
  });

  it('should show loading state while validating token', () => {
    vi.mocked(global.fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ valid: true, expiresAt: new Date() }),
              } as Response),
            100
          )
        )
    );

    renderComponent('valid-token');

    expect(screen.getByTestId('validating-token')).toBeInTheDocument();
  });

  it('should show error page for invalid token', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 410,
      json: async () => ({
        valid: false,
        error: 'Invalid or expired token',
      }),
    } as Response);

    renderComponent('invalid-token');

    await waitFor(() => {
      expect(screen.getByTestId('token-error')).toBeInTheDocument();
      expect(screen.getByText(/invalid or expired link/i)).toBeInTheDocument();
      expect(screen.getByTestId('request-new-link')).toBeInTheDocument();
    });
  });

  it('should show error page for missing token', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        valid: false,
        error: 'Token is required',
      }),
    } as Response);

    renderComponent('');

    await waitFor(() => {
      expect(screen.getByTestId('token-error')).toBeInTheDocument();
    });
  });

  it('should render password reset form for valid token', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        expiresAt: new Date(Date.now() + 3600000),
      }),
    } as Response);

    renderComponent('valid-token');

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });
  });

  it('should show password strength meter', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        expiresAt: new Date(Date.now() + 3600000),
      }),
    } as Response);

    renderComponent('valid-token');

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    await userEvent.type(passwordInput, 'Password123!');

    await waitFor(() => {
      // Password strength meter should appear
      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });
  });

  it('should validate password requirements', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        expiresAt: new Date(Date.now() + 3600000),
      }),
    } as Response);

    renderComponent('valid-token');

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(passwordInput, 'weak');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalledWith(
      '/api/auth/reset-password',
      expect.anything()
    );
  });

  it('should validate password confirmation match', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        expiresAt: new Date(Date.now() + 3600000),
      }),
    } as Response);

    renderComponent('valid-token');

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(passwordInput, 'NewP@ssw0rd123');
    await userEvent.type(confirmPasswordInput, 'DifferentP@ss1');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid password', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          expiresAt: new Date(Date.now() + 3600000),
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Password reset successfully',
        }),
      } as Response);

    renderComponent('valid-token');

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(passwordInput, 'NewP@ssw0rd123');
    await userEvent.type(confirmPasswordInput, 'NewP@ssw0rd123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'valid-token',
          newPassword: 'NewP@ssw0rd123',
          confirmPassword: 'NewP@ssw0rd123',
        }),
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?reset=success');
    });
  });

  it('should show error on password reset failure', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          expiresAt: new Date(Date.now() + 3600000),
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid or expired token',
        }),
      } as Response);

    renderComponent('valid-token');

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(passwordInput, 'NewP@ssw0rd123');
    await userEvent.type(confirmPasswordInput, 'NewP@ssw0rd123');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
    });
  });

  it('should have proper ARIA attributes', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        valid: true,
        expiresAt: new Date(Date.now() + 3600000),
      }),
    } as Response);

    renderComponent('valid-token');

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByTestId('submit-button');

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    expect(submitButton).toHaveAttribute('aria-label', 'Reset password');
  });
});
