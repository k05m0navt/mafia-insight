import { AuthError } from '@supabase/supabase-js';
import { getSupabaseErrorMapping } from './error-mapping';
import { errorTrackingService } from '../errorTracking';
import type { UserFriendlyError } from './error-mapping';
import type { AuthAction } from '../types/auth';

/**
 * Context for authentication error handling
 */
export interface AuthErrorContext {
  action: AuthAction;
  userId?: string;
  email?: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * Result of authentication error handling
 */
export interface AuthErrorResult {
  userFriendlyError: UserFriendlyError;
  shouldRetry: boolean;
  retryAfter?: number; // seconds
}

/**
 * Handle authentication errors and convert them to user-friendly messages
 */
export function handleAuthError(
  error: unknown,
  context: AuthErrorContext
): AuthErrorResult {
  // Log the error for monitoring
  const errorObj = error instanceof Error ? error : new Error(String(error));
  errorTrackingService.trackAuthError(errorObj, context.action);

  // Extract Supabase error code if available
  let errorCode = 'unknown_error';
  if (error instanceof AuthError) {
    errorCode = error.message.toLowerCase().replace(/\s+/g, '_');
  } else if (error instanceof Error) {
    errorCode = error.message.toLowerCase().replace(/\s+/g, '_');
  }

  // Get user-friendly error message
  const userFriendlyError = getSupabaseErrorMapping(errorCode, context.action);

  // Determine if error is retryable and when
  const retryAfter = getRetryDelay(errorCode);
  const shouldRetry = userFriendlyError.isRetryable && retryAfter !== undefined;

  return {
    userFriendlyError,
    shouldRetry,
    retryAfter,
  };
}

/**
 * Get retry delay for specific error codes
 */
function getRetryDelay(errorCode: string): number | undefined {
  const retryDelays: Record<string, number> = {
    too_many_requests: 300, // 5 minutes
    rate_limit_exceeded: 60, // 1 minute
    service_unavailable: 30, // 30 seconds
    network_error: 10, // 10 seconds
  };

  return retryDelays[errorCode];
}

/**
 * Wrap Supabase auth call with error handling
 */
export async function withAuthErrorHandling<T>(
  authCall: () => Promise<T>,
  context: AuthErrorContext
): Promise<{ data: T | null; error: UserFriendlyError | null }> {
  try {
    const data = await authCall();
    return { data, error: null };
  } catch (error) {
    const { userFriendlyError } = handleAuthError(error, context);
    return { data: null, error: userFriendlyError };
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(errorCode: string): boolean {
  const retryableErrors = [
    'too_many_requests',
    'network_error',
    'service_unavailable',
    'rate_limit_exceeded',
  ];
  return retryableErrors.includes(errorCode);
}

/**
 * Get recovery action for error
 */
export function getRecoveryAction(errorCode: string): string {
  const recoveryActions: Record<string, string> = {
    invalid_credentials: 'check_credentials',
    email_not_confirmed: 'check_email',
    weak_password: 'strengthen_password',
    too_many_requests: 'wait_and_retry',
    session_expired: 'refresh_session',
    token_expired: 'refresh_token',
  };

  return recoveryActions[errorCode] || 'contact_support';
}
