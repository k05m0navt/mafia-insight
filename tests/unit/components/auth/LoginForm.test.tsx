import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthProvider } from '@/components/auth/AuthProvider';

const MockedAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form with email and password fields', () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    );

    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    );

    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Email is required'
      );
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Password is required'
      );
    });
  });

  it('should show validation error for invalid email format', async () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toHaveTextContent(
        'Invalid email format'
      );
    });
  });

  it('should show loading state during login', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(loginButton).toBeDisabled();
  });

  it('should disable form fields during login', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('should show error message on login failure', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.login).mockRejectedValue(
      new Error('Invalid credentials')
    );

    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Invalid credentials'
      );
    });
  });

  it('should clear error when user starts typing', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.login).mockRejectedValue(
      new Error('Invalid credentials')
    );

    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  it('should call login service with correct credentials', async () => {
    const { authService } = await import('@/lib/auth');
    vi.mocked(authService.login).mockResolvedValue({
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
        <LoginForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  it('should be accessible with proper ARIA labels', () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should support keyboard navigation', () => {
    render(
      <MockedAuthProvider>
        <LoginForm />
      </MockedAuthProvider>
    );

    const emailInput = screen.getByTestId('email');
    const passwordInput = screen.getByTestId('password');
    const loginButton = screen.getByTestId('login-button');

    emailInput.focus();
    expect(document.activeElement).toBe(emailInput);

    fireEvent.keyDown(emailInput, { key: 'Tab' });
    expect(document.activeElement).toBe(passwordInput);

    fireEvent.keyDown(passwordInput, { key: 'Tab' });
    expect(document.activeElement).toBe(loginButton);
  });
});
