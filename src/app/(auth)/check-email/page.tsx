'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

export default function CheckEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>('');
  const email = searchParams.get('email') || 'your email';

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResendMessage('Verification email sent! Please check your inbox.');
      } else {
        setResendMessage(data.error || 'Failed to resend verification email.');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      setResendMessage(
        'An error occurred while sending the verification email.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
      aria-label="Check your email page"
    >
      <div
        className="max-w-md w-full space-y-8"
        data-testid="check-email-container"
      >
        <div className="bg-card py-8 px-6 shadow-lg rounded-lg border border-border">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Icon
                  icon={Mail}
                  size="xl"
                  className="text-primary"
                  decorative
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Check your email
            </h1>
            <p className="text-muted-foreground mb-6">
              We've sent a verification link to <strong>{email}</strong>
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Next steps:</strong>
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Check your email inbox</li>
                <li>Click the verification link in the email</li>
                <li>Return here to complete your registration</li>
              </ol>
            </div>
            {resendMessage && (
              <div
                className={`mb-4 p-3 rounded-md text-sm ${
                  resendMessage.includes('sent')
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                    : 'bg-destructive/10 text-destructive'
                }`}
                role="alert"
              >
                {resendMessage}
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full"
                variant="outline"
              >
                {isResending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Icon icon={Mail} size="sm" decorative />
                    Resend verification email
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
                variant="ghost"
              >
                <Icon icon={ArrowLeft} size="sm" decorative />
                Back to login
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="font-medium text-primary hover:text-primary/80 underline"
            >
              resend it
            </button>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
