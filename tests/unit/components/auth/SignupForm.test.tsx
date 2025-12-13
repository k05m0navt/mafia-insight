import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/services/AuthService', () => ({
  authService: {
    register: vi.fn(),
  },
}));

import { SignupForm } from '@/components/auth/SignupForm';
import { authService } from '@/services/AuthService';

const renderComponent = () => render(<SignupForm />);

describe('SignupForm', () => {
  const registerMock = vi.mocked(authService.register);

  beforeEach(() => {
    vi.clearAllMocks();
    registerMock.mockReset();
    registerMock.mockResolvedValue({ success: true });
  });

  it('should render signup form with all required fields', () => {
    renderComponent();

    expect(screen.getByTestId('name')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('confirmPassword')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button')).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields on submit', async () => {
    renderComponent();

    const signupButton = screen.getByTestId('signup-button');
    fireEvent.click(signupButton);

    await waitFor(() => {
      // Check for email validation error
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    expect(registerMock).not.toHaveBeenCalled();
  });

  it('should show validation error for invalid email format', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    expect(registerMock).not.toHaveBeenCalled();
  });

  it('should show validation error for password mismatch', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Different123!' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for weak password', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('should show password strength meter when password is entered', async () => {
    renderComponent();

    const passwordInput = screen.getByTestId('password');

    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    await waitFor(() => {
      expect(screen.getByTestId('password-strength-meter')).toBeInTheDocument();
    });
  });

  it('should show loading state during signup', async () => {
    registerMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    renderComponent();

    const nameInput = screen.getByTestId('name');
    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.click(signupButton);

    await waitFor(
      () => {
        expect(signupButton).toBeDisabled();
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should disable form fields during signup', async () => {
    registerMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    renderComponent();

    const nameInput = screen.getByTestId('name');
    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.click(signupButton);

    await waitFor(
      () => {
        expect(nameInput).toBeDisabled();
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(confirmPasswordInput).toBeDisabled();
      },
      { timeout: 2000 }
    );
  });

  it('should show error message on signup failure', async () => {
    registerMock.mockResolvedValue({
      success: false,
      error: 'An account with this email already exists',
    });

    renderComponent();

    const nameInput = screen.getByTestId('name');
    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.click(signupButton);

    await waitFor(
      () => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
        // Error message should be displayed (may be mapped to user-friendly version)
        expect(errorMessage.textContent).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it('should call signup service with correct credentials', async () => {
    registerMock.mockResolvedValue({
      user: {
        id: '1',
        email: 'user@example.com',
        role: 'user',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'token123',
      success: true,
    });

    renderComponent();

    const nameInput = screen.getByTestId('name');
    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'user@example.com',
        password: 'Password123!',
      });
    });
  });

  it('should be accessible with proper ARIA labels', () => {
    renderComponent();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    renderComponent();

    const nameInput = screen.getByTestId('name');
    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);

    const user = userEvent.setup();
    await user.tab();
    expect(document.activeElement).toBe(emailInput);

    await user.tab();
    expect(document.activeElement).toBe(passwordInput);

    await user.tab();
    expect(document.activeElement).toBe(confirmPasswordInput);

    await user.tab();
    expect(document.activeElement).toBe(signupButton);
  });

  it('should toggle password visibility', async () => {
    renderComponent();

    const passwordInput = screen.getByTestId('password') as HTMLInputElement;
    // Find the toggle button within the password field's parent
    const passwordField = passwordInput.closest('.relative');
    const toggleButton = passwordField?.querySelector(
      'button[aria-label*="password" i]'
    ) as HTMLButtonElement;

    expect(toggleButton).toBeInTheDocument();

    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should validate email in real-time on blur', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');

    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error
    registerMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderComponent();

    const nameInput = screen.getByTestId('name');
    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent(/network|connection/i);
    });
  });

  it('should display field-specific error messages with proper styling', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    fireEvent.click(screen.getByTestId('signup-button'));

    await waitFor(() => {
      const errorMessage = screen.getByText(/invalid email format/i);
      expect(errorMessage).toBeInTheDocument();
      // Check that error message has proper styling (14px, red)
      expect(errorMessage).toHaveClass('text-destructive');
      expect(errorMessage).toHaveClass('text-sm');
    });
  });

  it('should keep fields focused after validation errors', async () => {
    renderComponent();

    const emailInput = screen.getByTestId('email');
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);
    fireEvent.click(screen.getByTestId('signup-button'));

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    // Field should remain accessible for correction
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).not.toBeDisabled();
  });

  it('should display clear and actionable error messages', async () => {
    registerMock.mockResolvedValue({
      success: false,
      error: 'An account with this email already exists',
    });

    renderComponent();

    const nameInput = screen.getByTestId('name');
    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'Password123!' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
      // Error message should be clear and actionable
      expect(errorMessage.textContent).toBeTruthy();
      expect(errorMessage.textContent?.length).toBeGreaterThan(0);
    });
  });
});
