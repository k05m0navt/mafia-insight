'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface SignInRequiredProps {
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Sign In Required Component
 * Displays clear "Sign In Required" message with call-to-action
 * Provides smooth transition to sign-up flow with return URL
 */
export const SignInRequired: React.FC<SignInRequiredProps> = ({
  title = 'Sign In Required',
  description = 'You need to sign in to access this feature.',
  className = '',
}) => {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('from') || searchParams.get('returnUrl');

  // Build sign-in URL with return URL
  const signInUrl = returnUrl
    ? `/login?from=${encodeURIComponent(returnUrl)}`
    : '/login';

  // Build sign-up URL with return URL
  const signUpUrl = returnUrl
    ? `/signup?from=${encodeURIComponent(returnUrl)}`
    : '/signup';

  return (
    <div
      className={`flex items-center justify-center min-h-[400px] ${className}`}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-500" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This feature requires authentication. Please sign in to your
              account or create a new one to continue.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href={signInUrl}>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={signUpUrl}>Create Account</Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Don't have an account?{' '}
            <Link
              href={signUpUrl}
              className="text-primary hover:underline font-medium"
            >
              Sign up for free
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
