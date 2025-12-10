'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/AuthService';
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
import {
  registrationSchema,
  type RegistrationFormData,
} from '@/lib/auth/validation';
import { Loader2 } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { Eye, EyeOff } from 'lucide-react';
import { ErrorMappingService } from '@/lib/auth/error-mapping';
import { AuthAction } from '@/lib/types/auth';

interface SignupFormProps {
  onSuccess?: (email?: string) => void;
  className?: string;
}

export function SignupForm({ onSuccess, className = '' }: SignupFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const errorMappingService = React.useMemo(
    () => new ErrorMappingService(),
    []
  );

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
    mode: 'onBlur', // Validate on blur for real-time feedback
  });

  const password = form.watch('password');
  const email = form.watch('email');

  // Real-time email validation feedback
  React.useEffect(() => {
    if (email && form.formState.touchedFields.email) {
      form.trigger('email');
    }
  }, [email, form]);

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const result = await authService.register({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.success) {
        form.reset();
        onSuccess?.(data.email);
      } else {
        // Map error to user-friendly message
        try {
          const friendlyError = errorMappingService.mapAndFormatError(
            { message: result.error || 'Registration failed' },
            AuthAction.SIGNUP
          );
          setSubmitError(friendlyError.message);
        } catch {
          // Fallback to original error if mapping fails
          setSubmitError(result.error || 'Registration failed');
        }
      }
    } catch (_error) {
      console.error('Signup failed:', _error);

      // Handle network errors
      if (_error instanceof TypeError && _error.message.includes('fetch')) {
        const networkError = errorMappingService.getUserFriendlyError(
          errorMappingService.mapSupabaseError({ message: 'network error' }),
          AuthAction.SIGNUP
        );
        setSubmitError(networkError.message);
      } else {
        // Map other errors
        const friendlyError = errorMappingService.mapAndFormatError(
          _error,
          AuthAction.SIGNUP
        );
        setSubmitError(friendlyError.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={`space-y-4 ${className}`}
        data-testid="signup-form"
        noValidate
        aria-label="Registration form"
      >
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="name">Name</FormLabel>
              <FormControl>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  autoComplete="name"
                  disabled={isSubmitting}
                  aria-label="Name"
                  data-testid="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="email">Email</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-label="Email"
                  data-testid="email"
                  {...field}
                  onBlur={(_e) => {
                    field.onBlur();
                    // Trigger validation on blur for real-time feedback
                    form.trigger('email');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="password">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    aria-label="Password"
                    data-testid="password"
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
                      size="sm"
                      decorative
                    />
                  </button>
                </div>
              </FormControl>
              <FormMessage />
              {/* Password Strength Meter */}
              {password && (
                <PasswordStrengthMeter
                  password={password}
                  showRequirements
                  className="mt-2"
                />
              )}
            </FormItem>
          )}
        />

        {/* Confirm Password Field */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    aria-label="Confirm Password"
                    data-testid="confirmPassword"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                    tabIndex={-1}
                  >
                    <Icon
                      icon={showConfirmPassword ? EyeOff : Eye}
                      size="sm"
                      decorative
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
            style={{ fontSize: '14px' }}
            data-testid="error-message"
            role="alert"
            aria-live="polite"
          >
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          data-testid="signup-button"
          aria-label="Sign Up"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Creating account...</span>
            </>
          ) : (
            'Sign Up'
          )}
        </Button>
      </form>
    </Form>
  );
}
