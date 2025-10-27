'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { UserFriendlyError } from '@/lib/auth/error-mapping';

interface AuthErrorProps {
  error: UserFriendlyError | null;
  variant?: 'default' | 'compact';
  className?: string;
}

export const AuthError: React.FC<AuthErrorProps> = ({
  error,
  variant = 'default',
  className = '',
}) => {
  if (!error) return null;

  const getIcon = () => {
    switch (error.code) {
      case 'invalid_credentials':
      case 'user_not_found':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'email_not_confirmed':
      case 'email_not_verified':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'too_many_requests':
      case 'token_expired':
      case 'session_expired':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getVariantClasses = () => {
    if (variant === 'compact') {
      return 'p-3';
    }
    return 'p-4';
  };

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg ${getVariantClasses()} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900 mb-1">
            {error.message}
          </h3>

          {variant === 'default' && error.nextSteps.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-red-800 mb-1">
                What you can do:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {error.nextSteps.map((step, index) => (
                  <li key={index} className="text-xs text-red-700">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
