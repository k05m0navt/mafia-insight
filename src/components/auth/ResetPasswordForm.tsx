'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { passwordSchema } from '@/lib/auth/validation';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
  onSuccess?: () => void;
  className?: string;
}

export function ResetPasswordForm({
  token,
  onSuccess,
  className = '',
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isValidatingToken, setIsValidatingToken] = React.useState(true);
  const [tokenValid, setTokenValid] = React.useState(false);
  const [tokenError, setTokenError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const newPassword = form.watch('newPassword');

  // Validate token on component mount
  React.useEffect(() => {
    const validateToken = async () => {
      try {
        setIsValidatingToken(true);
        const response = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`
        );
        const result = await response.json();

        if (response.ok && result.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(result.error || 'Invalid or expired token');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setTokenValid(false);
        setTokenError('An error occurred while validating the token');
      } finally {
        setIsValidatingToken(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setTokenValid(false);
      setTokenError('Token is required');
      setIsValidatingToken(false);
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Redirect to login page with success message
        router.push('/login?reset=success');
        onSuccess?.();
      } else {
        setSubmitError(
          result.error || 'Failed to reset password. Please try again.'
        );
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      setSubmitError('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while validating token
  if (isValidatingToken) {
    return (
      <div
        className="flex items-center justify-center py-8"
        data-testid="validating-token"
      >
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Validating token"
        />
        <span className="sr-only">Validating reset token...</span>
      </div>
    );
  }

  // Show error page if token is invalid or expired
  if (!tokenValid) {
    return (
      <div className="space-y-4" data-testid="token-error">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Invalid or Expired Link
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {tokenError ||
              'This password reset link is invalid or has expired.'}
          </p>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary/90 transition-colors"
            data-testid="request-new-link"
          >
            Request a new password reset link
          </Link>
        </div>
      </div>
    );
  }

  // Show password reset form
  return (
    <div className={className}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          data-testid="reset-password-form"
          noValidate
          aria-label="Reset password form"
        >
          {/* New Password Field */}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="newPassword">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      aria-label="New password"
                      data-testid="new-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      tabIndex={-1}
                    >
                      <Icon
                        icon={showPassword ? EyeOff : Eye}
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Strength Meter */}
          {newPassword && (
            <PasswordStrengthMeter
              password={newPassword}
              showRequirements={true}
              className="mt-2"
            />
          )}

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="confirmPassword">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      aria-label="Confirm password"
                      data-testid="confirm-password"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                      tabIndex={-1}
                    >
                      <Icon
                        icon={showConfirmPassword ? EyeOff : Eye}
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Error */}
          {submitError && (
            <div
              className="text-sm font-medium text-destructive"
              role="alert"
              aria-live="polite"
              data-testid="error-message"
            >
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            data-testid="submit-button"
            aria-label="Reset password"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Resetting password...
              </>
            ) : (
              'Reset password'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
