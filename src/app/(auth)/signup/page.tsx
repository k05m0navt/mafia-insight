'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
      aria-label="Signup page"
    >
      <div className="max-w-md w-full space-y-8" data-testid="signup-container">
        <div>
          <h1 className="text-3xl font-bold text-center text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Get started with your free account today.
          </p>
        </div>

        {showSuccess ? (
          <div className="bg-card py-8 px-6 shadow-lg rounded-lg border border-border">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg
                  className="h-16 w-16 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Account created successfully!
              </h2>
              <p className="text-muted-foreground mb-4">
                Please check your email to verify your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card py-8 px-6 shadow-lg rounded-lg border border-border">
            <SignupForm onSuccess={handleSuccess} />

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Log in to your existing account
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
