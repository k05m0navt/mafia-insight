'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { UserFriendlyError } from '@/lib/auth/error-mapping';
import { Button } from '@/components/ui/button';

interface ErrorAlertProps {
  error: UserFriendlyError | null;
  onDismiss?: () => void;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  variant = 'default',
  showIcon = true,
  className = '',
}) => {
  if (!error) return null;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 
        bg-red-50 border border-red-200 
        rounded-lg text-red-900
        ${variant === 'compact' ? 'p-3' : 'p-4'}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {showIcon && (
        <div className="flex-shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-red-900">
            {error.message}
          </h3>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {variant === 'default' && error.nextSteps.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-red-800 mb-1.5">
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
  );
};
