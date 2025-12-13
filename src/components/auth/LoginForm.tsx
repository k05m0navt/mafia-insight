'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/AuthService';
import { useToast } from '@/components/hooks/use-toast';
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
import { Loader2 } from 'lucide-react';
import { Icon } from '@/components/ui/icon';
import { Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { emailSchema } from '@/lib/auth/validation';
import { ErrorMappingService } from '@/lib/auth/error-mapping';
import { AuthAction } from '@/lib/types/auth';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, className = '' }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const errorMappingService = React.useMemo(
    () => new ErrorMappingService(),
    []
  );

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const result = await authService.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (result.success) {
        toast({
          title: 'Login Successful',
          description:
            result.message || `Welcome back, ${result.user?.name || 'User'}!`,
          variant: 'default',
        });

        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            router.push('/players');
          }, 500);
        }
      } else {
        try {
          const friendlyError = errorMappingService.mapAndFormatError(
            { message: result.error || 'Login failed' },
            AuthAction.LOGIN
          );
          setSubmitError(friendlyError.message);
        } catch {
          setSubmitError(result.error || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = errorMappingService.getUserFriendlyError(
          errorMappingService.mapSupabaseError({ message: 'network error' }),
          AuthAction.LOGIN
        );
        setSubmitError(networkError.message);
      } else {
        const friendlyError = errorMappingService.mapAndFormatError(
          error,
          AuthAction.LOGIN
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
        data-testid="login-form"
        noValidate
        aria-label="Login form"
      >
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
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    aria-label="Password"
                    data-testid="password"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                    data-testid="password-visibility-toggle"
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
            </FormItem>
          )}
        />

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    id="remember-me"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                    data-testid="remember-me"
                    aria-describedby="remember-me-description"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel
                    htmlFor="remember-me"
                    className="text-sm font-normal cursor-pointer"
                    id="remember-me-description"
                  >
                    Remember me
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary/90 transition-colors"
            data-testid="forgot-password-link"
          >
            Forgot password?
          </Link>
        </div>

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
          data-testid="login-button"
          aria-label="Login"
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="h-4 w-4 animate-spin mr-2"
                aria-hidden="true"
              />
              <span>Logging in...</span>
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>
    </Form>
  );
}
