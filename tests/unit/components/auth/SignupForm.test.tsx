import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SignupForm } from '@/components/auth/SignupForm';
import { AuthProvider } from '@/components/auth/AuthProvider';

// Mock the auth service
vi.mock('@/lib/auth', () => ({
  authService: {
    signup: vi.fn(),
  },
  validateSignupCredentials: vi.fn(),
}));

const MockedAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render signup form with email, password, and confirm password fields', () => {
    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('confirmPassword')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button')).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const signupButton = screen.getByTestId('signup-button');
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Email is required'
      );
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password is required'
      );
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Confirm password is required'
      );
    });
  });

  it('should show validation error for invalid email format', async () => {
    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Invalid email format'
      );
    });
  });

  it('should show validation error for password mismatch', async () => {
    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'differentpassword' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Passwords do not match'
      );
    });
  });

  it('should show validation error for weak password', async () => {
    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password must be at least 8 characters'
      );
    });
  });

  it('should show loading state during signup', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.signup).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(signupButton);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(signupButton).toBeDisabled();
  });

  it('should disable form fields during signup', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.signup).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(signupButton);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
  });

  it('should show error message on signup failure', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.signup).mockRejectedValue(
      new Error('Email already exists')
    );

    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Email already exists'
      );
    });
  });

  it('should clear error when user starts typing', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.signup).mockRejectedValue(
      new Error('Email already exists')
    );

    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  it('should call signup service with correct credentials', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.signup).mockResolvedValue({
      user: {
        id: '1',
        email: 'user@example.com',
        role: 'user',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'token123',
    });

    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: 'password123' },
    });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
    });
  });

  it('should be accessible with proper ARIA labels', () => {
    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign up/i })
    ).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    render(
      <MockedAuthProvider>
        <SignupForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const confirmPasswordInput = screen.getByTestId('confirmPassword');
    const signupButton = screen.getByTestId('signup-button');

    emailInput.focus();
    expect(document.activeElement).toBe(emailInput);

    fireEvent.keyDown(emailInput, { key: 'Tab' });
    expect(document.activeElement).toBe(passwordInput);

    fireEvent.keyDown(passwordInput, { key: 'Tab' });
    expect(document.activeElement).toBe(confirmPasswordInput);

    fireEvent.keyDown(confirmPasswordInput, { key: 'Tab' });
    expect(document.activeElement).toBe(signupButton);
  });
});
