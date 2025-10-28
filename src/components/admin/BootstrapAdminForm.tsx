'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Shield, CheckCircle } from 'lucide-react';
import { ErrorAlert } from '@/components/auth/ErrorAlert';
import type { UserFriendlyError } from '@/lib/auth/error-mapping';
import { AuthErrorCode } from '@/lib/types/auth';

const bootstrapAdminSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
});

type BootstrapAdminFormData = z.infer<typeof bootstrapAdminSchema>;

interface BootstrapAdminFormProps {
  onSuccess?: (user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }) => void;
  className?: string;
}

export const BootstrapAdminForm: React.FC<BootstrapAdminFormProps> = ({
  onSuccess,
  className = '',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [needsBootstrap, setNeedsBootstrap] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const form = useForm<BootstrapAdminFormData>({
    resolver: zodResolver(bootstrapAdminSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  });

  useEffect(() => {
    checkBootstrapStatus();
  }, []);

  const checkBootstrapStatus = async () => {
    try {
      const response = await fetch('/api/admin/bootstrap');
      const data = await response.json();
      setNeedsBootstrap(data.needsBootstrap);
    } catch (err) {
      console.error('Error checking bootstrap status:', err);
      setNeedsBootstrap(false);
    } finally {
      setIsChecking(false);
    }
  };

  const onSubmit = async (data: BootstrapAdminFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create admin user');
      }

      const result = await response.json();
      form.reset();
      onSuccess?.(result.user);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError({
        code: AuthErrorCode.INTERNAL_ERROR,
        message: errorMessage,
        action: 'bootstrap_admin',
        nextSteps: [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the problem persists',
        ],
        isRetryable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (needsBootstrap === false) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              System Already Initialized
            </h3>
            <p className="text-muted-foreground">
              Admin users already exist in the system. Use the regular user
              creation interface to add more users.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Create First Admin User
        </CardTitle>
        <CardDescription>
          This will create the first administrator account for the system. This
          can only be done once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <ErrorAlert error={error} onDismiss={() => setError(null)} />
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be the admin user's login email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Admin User" {...field} />
                  </FormControl>
                  <FormDescription>
                    The display name for the admin user
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Admin...
                  </>
                ) : (
                  'Create Admin User'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
