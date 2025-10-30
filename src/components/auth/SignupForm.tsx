'use client';

import React, { useState } from 'react';
import { authService } from '@/services/AuthService';
import { validateSignupCredentials } from '@/lib/auth';

interface SignupFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function SignupForm({ onSuccess, className = '' }: SignupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    // Get form data from the form element itself as a fallback
    const form = e.currentTarget;
    const formElements = form.elements as typeof form.elements & {
      name: HTMLInputElement;
      email: HTMLInputElement;
      password: HTMLInputElement;
      confirmPassword: HTMLInputElement;
    };

    // Use form elements values if state is empty (fallback for testing tools)
    const submitData = {
      name: formData.name || formElements.name?.value || '',
      email: formData.email || formElements.email?.value || '',
      password: formData.password || formElements.password?.value || '',
      confirmPassword:
        formData.confirmPassword || formElements.confirmPassword?.value || '',
    };

    // Clear previous validation errors
    setValidationErrors({});

    // Validate form data
    const validation = validateSignupCredentials(submitData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await authService.register(submitData);

      if (result.success) {
        // Clear form on success
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        onSuccess?.();
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
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
      data-testid="signup-form"
    >
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter your name"
          data-testid="name"
          aria-label="Name"
        />
      </div>

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

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Confirm your password"
          data-testid="confirmPassword"
          aria-label="Confirm Password"
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
            Creating account...
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="signup-button"
        aria-label="Sign Up"
      >
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
