import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoginPage from '@/app/(auth)/login/page';
import { AuthProvider } from '@/components/auth/AuthProvider';

const MockedAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('LoginPage', () => {
  it('should render login page with title and form', () => {
    render(
      <MockedAuthProvider>
        <LoginPage />
      </MockedAuthProvider>
    );

    expect(screen.getByText('Login to your account')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    render(
      <MockedAuthProvider>
        <LoginPage />
      </MockedAuthProvider>
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('login-container')).toBeInTheDocument();
  });

  it('should be responsive on mobile', () => {
    render(
      <MockedAuthProvider>
        <LoginPage />
      </MockedAuthProvider>
    );

    const container = screen.getByTestId('login-container');
    expect(container).toHaveClass(
      'min-h-screen',
      'flex',
      'items-center',
      'justify-center'
    );
  });

  it('should have proper heading hierarchy', () => {
    render(
      <MockedAuthProvider>
        <LoginPage />
      </MockedAuthProvider>
    );

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Login to your account');
  });

  it('should have link to signup page', () => {
    render(
      <MockedAuthProvider>
        <LoginPage />
      </MockedAuthProvider>
    );

    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('should have proper meta information', () => {
    render(
      <MockedAuthProvider>
        <LoginPage />
      </MockedAuthProvider>
    );

    // Check for accessibility attributes
    expect(screen.getByRole('main')).toHaveAttribute(
      'aria-label',
      'Login page'
    );
  });
});
