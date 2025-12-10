'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    'loading' | 'success' | 'error' | 'expired'
  >('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Supabase sends verification tokens via URL hash fragments
      // We need to extract them from the URL

      // Get hash fragments from URL (Supabase uses hash fragments for security)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const token = hashParams.get('token') || searchParams.get('token');
      const type =
        hashParams.get('type') || searchParams.get('type') || 'email';
      const tokenHash =
        hashParams.get('token_hash') || searchParams.get('token_hash');

      // If no token in hash or search params, check if Supabase already verified
      if (!token && !tokenHash) {
        // Check if user is already verified by checking session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          setStatus('success');
          setMessage('Your email has already been verified!');
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 2000);
          return;
        }

        setStatus('error');
        setMessage(
          'Invalid verification link. Please request a new verification email.'
        );
        return;
      }

      try {
        // Verify the email using Supabase client
        // Supabase handles token validation and expiration (24 hours)
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash || token || '',
          type: type as 'email',
        });

        if (error) {
          console.error('Email verification error:', error);

          if (
            error.message.includes('expired') ||
            error.message.includes('invalid')
          ) {
            setStatus('expired');
            setMessage(
              'This verification link has expired or is invalid. Please request a new one.'
            );
          } else if (error.message.includes('already verified')) {
            setStatus('success');
            setMessage('Your email has already been verified!');
            setTimeout(() => {
              router.push('/login?verified=true');
            }, 2000);
          } else {
            setStatus('error');
            setMessage(
              error.message || 'Failed to verify email. Please try again.'
            );
          }
          return;
        }

        if (data.user) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Failed to verify email. Please try again.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const handleResendEmail = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: searchParams.get('email'),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(data.error || 'Failed to resend verification email.');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      setMessage('An error occurred while sending the verification email.');
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8"
      aria-label="Email verification page"
    >
      <div
        className="max-w-md w-full space-y-8"
        data-testid="verify-email-container"
      >
        <div className="bg-card py-8 px-6 shadow-lg rounded-lg border border-border">
          {status === 'loading' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Verifying your email...
              </h2>
              <p className="text-muted-foreground">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Icon
                  icon={CheckCircle2}
                  size="xl"
                  className="text-green-500"
                  decorative
                />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Email Verified!
              </h2>
              <p className="text-muted-foreground mb-4">{message}</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            </div>
          )}

          {(status === 'error' || status === 'expired') && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Icon
                  icon={status === 'expired' ? XCircle : Mail}
                  size="xl"
                  className="text-destructive"
                  decorative
                />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {status === 'expired' ? 'Link Expired' : 'Verification Failed'}
              </h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                {searchParams.get('email') && (
                  <Button
                    onClick={handleResendEmail}
                    className="w-full"
                    variant="default"
                  >
                    <Icon icon={Mail} size="sm" decorative />
                    Resend Verification Email
                  </Button>
                )}
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                  variant="outline"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
