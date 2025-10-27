'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { UserFriendlyError } from '@/lib/auth/error-mapping';

interface ErrorMessageProps {
  error: UserFriendlyError | null;
  variant?: 'default' | 'compact' | 'inline';
  showIcon?: boolean;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  variant = 'default',
  showIcon = true,
  className = '',
}) => {
  if (!error) return null;

  const getIcon = () => {
    if (!showIcon) return null;

    switch (error.code) {
      case 'invalid_credentials':
      case 'user_not_found':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'email_not_confirmed':
      case 'email_not_verified':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'too_many_requests':
      case 'token_expired':
      case 'session_expired':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-2 text-sm';
      case 'inline':
        return 'p-1 text-xs';
      default:
        return 'p-3 text-sm';
    }
  };

  return (
    <div
      className={`
        flex items-start gap-2
        bg-red-50 border border-red-200 
        rounded-md text-red-900
        ${getVariantClasses()}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{error.message}</p>
        {variant === 'default' && error.nextSteps.length > 0 && (
          <div className="mt-1">
            <p className="text-xs font-medium text-red-800 mb-1">
              What you can do:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
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
  );
};
