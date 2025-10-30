'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    console.log('Login successful, redirecting to home page');
    router.push('/');
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
      aria-label="Login page"
    >
      <div className="max-w-md w-full space-y-8" data-testid="login-container">
        <div>
          <h1 className="text-3xl font-bold text-center text-foreground">
            Login to your account
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        <div className="bg-card py-8 px-6 shadow-lg rounded-lg border border-border">
          <LoginForm onSuccess={handleSuccess} />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/signup"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign up for a new account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
