'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

interface AccessDeniedProps {
  reason: 'authentication' | 'permissions';
  requiredPermissions?: string[];
  className?: string;
}

export function AccessDenied({
  reason,
  requiredPermissions = [],
  className = '',
}: AccessDeniedProps) {
  const { authState } = useAuth();

  const getTitle = () => {
    if (reason === 'authentication') {
      return 'Authentication Required';
    }
    return 'Access Denied';
  };

  const getMessage = () => {
    if (reason === 'authentication') {
      return 'You need to log in to access this page.';
    }
    return 'You do not have permission to access this page.';
  };

  const getSuggestedActions = () => {
    if (reason === 'authentication') {
      return (
        <div className="mt-4 space-y-2">
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-block ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign Up
          </Link>
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Required permissions: {requiredPermissions.join(', ')}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your current role: {authState.user?.role || 'guest'}
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-block ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 ${className}`}
      data-testid="access-denied"
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            {getTitle()}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {getMessage()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-lg">
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              What can you do?
            </h2>
            <div
              className="text-sm text-gray-600 dark:text-gray-400 mb-4"
              data-testid="suggested-actions"
            >
              {getSuggestedActions()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
