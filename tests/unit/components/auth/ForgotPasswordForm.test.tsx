import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

const renderComponent = () => render(<ForgotPasswordForm />);

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockClear();
  });

  it('should render form with email field and submit button', () => {
    renderComponent();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-login-link')).toBeInTheDocument();
  });

  it('should show validation error for invalid email format', async () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should show validation error for empty email', async () => {
    renderComponent();

    const submitButton = screen.getByTestId('submit-button');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should submit form with valid email', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message:
          'If an account exists with this email, a password reset link has been sent.',
      }),
    } as Response);

    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'user@example.com' }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
    });
  });

  it('should show error message on API failure', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Failed to send password reset email',
      }),
    } as Response);

    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/failed to send/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    vi.mocked(global.fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true, message: 'Success' }),
              } as Response),
            100
          )
        )
    );

    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.click(submitButton);

    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText(/sending/i)).not.toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
    });
  });

  it('should clear form after successful submission', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message:
          'If an account exists with this email, a password reset link has been sent.',
      }),
    } as Response);

    renderComponent();

    const emailInput = screen.getByLabelText(
      /email address/i
    ) as HTMLInputElement;
    const submitButton = screen.getByTestId('submit-button');

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput.value).toBe('');
    });
  });

  it('should have proper ARIA attributes', () => {
    renderComponent();

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('aria-describedby');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');

    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toHaveAttribute(
      'aria-label',
      'Send password reset email'
    );
  });
});
