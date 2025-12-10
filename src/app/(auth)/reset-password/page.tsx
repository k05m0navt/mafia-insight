'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { PageTransition } from '@/components/layout/PageTransition';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <PageTransition>
      <main
        className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
        aria-label="Reset password page"
      >
        <div
          className="max-w-md w-full space-y-8"
          data-testid="reset-password-container"
        >
          <div>
            <h1 className="text-3xl font-bold text-center text-foreground">
              Reset Password
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          <div className="bg-card py-8 px-6 shadow-lg rounded-lg border border-border">
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <div
                className="text-center space-y-4"
                data-testid="no-token-error"
              >
                <p className="text-sm text-destructive">
                  No reset token provided. Please use the link from your email.
                </p>
                <a
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/90 transition-colors"
                >
                  Request a new password reset link
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
