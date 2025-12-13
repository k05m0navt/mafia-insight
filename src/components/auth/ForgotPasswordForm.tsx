'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { emailSchema } from '@/lib/auth/validation';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onSuccess?: (email?: string) => void;
  className?: string;
}

export function ForgotPasswordForm({
  onSuccess,
  className = '',
}: ForgotPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onBlur',
  });

  const email = form.watch('email');

  // Real-time email validation feedback
  React.useEffect(() => {
    if (email && form.formState.touchedFields.email) {
      form.trigger('email');
    }
  }, [email, form]);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage(
          result.message ||
            'If an account exists with this email, a password reset link has been sent.'
        );
        form.reset();
        onSuccess?.(data.email);
      } else {
        setSubmitError(
          result.error ||
            'Failed to send password reset email. Please try again.'
        );
      }
    } catch (error) {
      console.error('Forgot password failed:', error);
      setSubmitError('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email">Email address</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={isSubmitting}
                    aria-describedby="email-description"
                    aria-invalid={
                      form.formState.errors.email ? 'true' : 'false'
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage id="email-description" />
              </FormItem>
            )}
          />

          {/* Success Message */}
          {successMessage && (
            <div
              className="text-sm font-medium text-green-600 dark:text-green-400"
              role="alert"
              aria-live="polite"
              data-testid="success-message"
            >
              {successMessage}
            </div>
          )}

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
            aria-label="Send password reset email"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-primary hover:text-primary/90 transition-colors"
              data-testid="back-to-login-link"
            >
              Back to login
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
