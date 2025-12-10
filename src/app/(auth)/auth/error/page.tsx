'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * OAuth error page
 * Displays user-friendly error messages for OAuth authentication failures
 */
export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; message: string }> = {
    Configuration: {
      title: 'Configuration Error',
      message:
        'There is a problem with the server configuration. Please contact support.',
    },
    AccessDenied: {
      title: 'Access Denied',
      message:
        'You did not grant the necessary permissions. Please try again and authorize the application.',
    },
    Verification: {
      title: 'Verification Error',
      message:
        'The verification token has expired or has already been used. Please try signing in again.',
    },
    Default: {
      title: 'Authentication Error',
      message:
        'An error occurred during authentication. Please try again or use email and password to sign in.',
    },
  };

  const errorInfo =
    error && errorMessages[error]
      ? errorMessages[error]
      : errorMessages.Default;

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
      aria-label="Authentication error page"
    >
      <div className="max-w-md w-full space-y-8">
        <div className="bg-card py-8 px-6 shadow-lg rounded-lg border border-border text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle
              className="h-16 w-16 text-destructive"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-muted-foreground mb-6">{errorInfo.message}</p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
