'use client';

import React from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <PageTransition>
      <main
        className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
        aria-label="Forgot password page"
      >
        <div
          className="max-w-md w-full space-y-8"
          data-testid="forgot-password-container"
        >
          <div>
            <h1 className="text-3xl font-bold text-center text-foreground">
              Forgot Password
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <div className="bg-card py-8 px-6 shadow-lg rounded-lg border border-border">
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
