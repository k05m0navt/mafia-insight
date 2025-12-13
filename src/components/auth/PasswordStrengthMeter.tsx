'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

interface PasswordStrengthMeterProps {
  /**
   * The password to analyze
   */
  password: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show password requirements helper text
   * @default true
   */
  showRequirements?: boolean;
}

/**
 * Calculate password strength based on requirements
 * Requirements: min 8 chars, 1 uppercase, 1 number, 1 special char
 */
function calculatePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number; // 0-100
  meetsRequirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
} {
  if (!password) {
    return {
      strength: 'weak',
      score: 0,
      meetsRequirements: {
        minLength: false,
        hasUppercase: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const meetsRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  // If minimum length requirement is not met, always return weak
  if (!meetsRequirements.minLength) {
    return {
      strength: 'weak',
      score: Math.min((password.length / 8) * 20, 20),
      meetsRequirements,
    };
  }

  // Count how many requirements are met (excluding minLength since it's already checked)
  const otherRequirementsMet = [
    meetsRequirements.hasUppercase,
    meetsRequirements.hasNumber,
    meetsRequirements.hasSpecial,
  ].filter(Boolean).length;

  // Calculate score (0-100)
  // Base score from requirements (20-80 points)
  // 20 points for meeting minLength, 20 points each for the other 3 requirements
  const baseScore = 20 + (otherRequirementsMet / 3) * 60;

  // Bonus for length (up to 20 points)
  const lengthBonus = Math.min((password.length - 8) / 12, 1) * 20;

  const score = Math.min(baseScore + lengthBonus, 100);

  // Determine strength
  let strength: PasswordStrength;
  if (score < 40) {
    strength = 'weak';
  } else if (score < 70) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    strength,
    score,
    meetsRequirements,
  };
}

/**
 * PasswordStrengthMeter Component
 *
 * Displays visual feedback for password strength with indicators
 * (weak/medium/strong) and optional requirements helper text.
 *
 * @example
 * ```tsx
 * <PasswordStrengthMeter password={password} showRequirements />
 * ```
 */
export function PasswordStrengthMeter({
  password,
  className,
  showRequirements = true,
}: PasswordStrengthMeterProps) {
  const { strength, score, meetsRequirements } =
    calculatePasswordStrength(password);

  // Don't show anything if password is empty
  if (!password) {
    return null;
  }

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  const strengthTextColors = {
    weak: 'text-red-600 dark:text-red-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    strong: 'text-green-600 dark:text-green-400',
  };

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid="password-strength-meter"
      role="region"
      aria-label="Password strength indicator"
    >
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              'font-medium capitalize',
              strengthTextColors[strength]
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {strengthLabels[strength]}
          </span>
        </div>
        <div className="relative">
          <Progress
            value={score}
            className="h-2"
            data-testid="password-strength-progress"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Password strength: ${strengthLabels[strength]}`}
            role="progressbar"
          />
        </div>
      </div>

      {/* Requirements helper text */}
      {showRequirements && (
        <div
          className="space-y-1 text-sm"
          data-testid="password-requirements"
          role="group"
          aria-label="Password requirements"
        >
          <p className="text-muted-foreground font-medium">
            Password requirements:
          </p>
          <ul
            className="space-y-0.5 text-xs text-muted-foreground"
            aria-label="Password requirements checklist"
          >
            <li
              className={cn(
                'flex items-center gap-2',
                meetsRequirements.minLength
                  ? 'text-green-600 dark:text-green-400'
                  : ''
              )}
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  meetsRequirements.minLength
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
                aria-hidden="true"
              />
              At least 8 characters
            </li>
            <li
              className={cn(
                'flex items-center gap-2',
                meetsRequirements.hasUppercase
                  ? 'text-green-600 dark:text-green-400'
                  : ''
              )}
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  meetsRequirements.hasUppercase
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
                aria-hidden="true"
              />
              One uppercase letter
            </li>
            <li
              className={cn(
                'flex items-center gap-2',
                meetsRequirements.hasNumber
                  ? 'text-green-600 dark:text-green-400'
                  : ''
              )}
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  meetsRequirements.hasNumber
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
                aria-hidden="true"
              />
              One number
            </li>
            <li
              className={cn(
                'flex items-center gap-2',
                meetsRequirements.hasSpecial
                  ? 'text-green-600 dark:text-green-400'
                  : ''
              )}
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  meetsRequirements.hasSpecial
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                )}
                aria-hidden="true"
              />
              One special character
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
