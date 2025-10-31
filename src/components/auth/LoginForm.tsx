'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/AuthService';
import { validateLoginCredentials } from '@/lib/auth';
import { useToast } from '@/components/hooks/use-toast';

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ onSuccess, className = '' }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Clear auth error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('LoginForm: handleSubmit called');

    // Get form data from the form element itself as a fallback
    const form = e.currentTarget;
    const formElements = form.elements as typeof form.elements & {
      email: HTMLInputElement;
      password: HTMLInputElement;
    };

    // Use form elements values if state is empty (fallback for testing tools)
    const submitData = {
      email: formData.email || formElements.email?.value || '',
      password: formData.password || formElements.password?.value || '',
    };

    console.log('LoginForm: submitData:', submitData);

    // Clear previous validation errors
    setValidationErrors({});

    // Validate form data
    const validation = validateLoginCredentials(submitData);
    if (!validation.isValid) {
      console.log('LoginForm: validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      console.log('LoginForm: calling authService.login');
      const result = await authService.login(submitData);
      console.log('LoginForm: authService.login result:', result);

      if (result.success) {
        console.log('LoginForm: login successful, calling onSuccess');

        // Show success toast notification
        toast({
          title: 'Login Successful',
          description:
            result.message || `Welcome back, ${result.user?.name || 'User'}!`,
          variant: 'default',
        });

        // Call success callback or redirect
        if (onSuccess) {
          onSuccess();
        } else {
          // Default redirect to dashboard/players page
          setTimeout(() => {
            router.push('/players');
          }, 500);
        }
      } else {
        console.log('LoginForm: login failed:', result.error);
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('LoginForm: login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidationErrors = Object.values(validationErrors).some(
    (error) => error
  );
  const hasError = error || hasValidationErrors;
  const errorMessage = error || Object.values(validationErrors)[0] || '';

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 ${className}`}
      data-testid="login-form"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter your email"
          data-testid="email"
          aria-label="Email"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter your password"
          data-testid="password"
          aria-label="Password"
        />
      </div>

      {hasError && (
        <div
          className="text-red-600 dark:text-red-400 text-sm"
          data-testid="error-message"
        >
          {errorMessage}
        </div>
      )}

      {hasValidationErrors && (
        <div
          className="text-red-600 dark:text-red-400 text-sm"
          data-testid="validation-error"
        >
          {Object.values(validationErrors).map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}

      {isSubmitting && (
        <div className="flex items-center justify-center" data-testid="loading">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Logging in...
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="login-button"
        aria-label="Login"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
