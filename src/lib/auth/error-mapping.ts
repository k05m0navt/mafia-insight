import { AuthErrorCode, AuthAction } from '../types/auth';

/**
 * User-friendly error message interface
 */
export interface UserFriendlyError {
  code: AuthErrorCode;
  message: string;
  action: string;
  nextSteps: string[];
  isRetryable: boolean;
}

/**
 * Supabase error code mapping to our error codes
 */
const supabaseErrorMapping: Record<string, AuthErrorCode> = {
  invalid_credentials: AuthErrorCode.INVALID_CREDENTIALS,
  email_not_confirmed: AuthErrorCode.EMAIL_NOT_CONFIRMED,
  too_many_requests: AuthErrorCode.TOO_MANY_REQUESTS,
  weak_password: AuthErrorCode.WEAK_PASSWORD,
  email_already_exists: AuthErrorCode.EMAIL_ALREADY_EXISTS,
  token_expired: AuthErrorCode.TOKEN_EXPIRED,
  session_expired: AuthErrorCode.SESSION_EXPIRED,
  user_not_found: AuthErrorCode.USER_NOT_FOUND,
  email_not_verified: AuthErrorCode.EMAIL_NOT_VERIFIED,
  invalid_token: AuthErrorCode.INVALID_TOKEN,
};

/**
 * User-friendly error messages
 */
const errorMessages: Record<AuthErrorCode, UserFriendlyError> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    code: AuthErrorCode.INVALID_CREDENTIALS,
    message: 'Invalid email or password',
    action: 'check_credentials',
    nextSteps: [
      'Check that you entered your email correctly',
      'Verify your password is correct',
      'Make sure Caps Lock is not enabled',
      "Try resetting your password if you've forgotten it",
    ],
    isRetryable: true,
  },
  [AuthErrorCode.EMAIL_NOT_CONFIRMED]: {
    code: AuthErrorCode.EMAIL_NOT_CONFIRMED,
    message: 'Please confirm your email address',
    action: 'confirm_email',
    nextSteps: [
      'Check your email inbox for a confirmation message',
      'Look in your spam or junk folder',
      'Click the confirmation link in the email',
      'Request a new confirmation email if needed',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.TOO_MANY_REQUESTS]: {
    code: AuthErrorCode.TOO_MANY_REQUESTS,
    message: 'Too many requests. Please try again later',
    action: 'wait_and_retry',
    nextSteps: [
      'Wait a few minutes before trying again',
      'Clear your browser cache and cookies',
      'Check your internet connection',
      'Contact support if the problem persists',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.WEAK_PASSWORD]: {
    code: AuthErrorCode.WEAK_PASSWORD,
    message: 'Password does not meet security requirements',
    action: 'improve_password',
    nextSteps: [
      'Use at least 8 characters',
      'Include both uppercase and lowercase letters',
      'Add at least one number',
      'Include special characters (e.g., !@#$%)',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: {
    code: AuthErrorCode.EMAIL_ALREADY_EXISTS,
    message: 'An account with this email already exists',
    action: 'sign_in_instead',
    nextSteps: [
      'Try signing in with this email instead',
      'Use a different email address',
      'Reset your password if you forgot it',
      'Contact support for account recovery',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.TOKEN_EXPIRED]: {
    code: AuthErrorCode.TOKEN_EXPIRED,
    message: 'Your session has expired',
    action: 'refresh_session',
    nextSteps: [
      'Please sign in again',
      'Your session may have timed out due to inactivity',
      'Check that your system clock is correct',
      'Try clearing your browser cookies',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.SESSION_EXPIRED]: {
    code: AuthErrorCode.SESSION_EXPIRED,
    message: 'Your session has expired. Please sign in again',
    action: 'sign_in_again',
    nextSteps: [
      'Sign in with your email and password',
      'Your session expired for security reasons',
      'Check your internet connection',
      'Try using an incognito or private window',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.NETWORK_ERROR]: {
    code: AuthErrorCode.NETWORK_ERROR,
    message: 'Network error. Please check your connection',
    action: 'check_connection',
    nextSteps: [
      'Check your internet connection',
      'Try refreshing the page',
      "Disable VPN if you're using one",
      'Contact your network administrator',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.INTERNAL_ERROR]: {
    code: AuthErrorCode.INTERNAL_ERROR,
    message: 'An error occurred. Please try again',
    action: 'retry_action',
    nextSteps: [
      'Wait a moment and try again',
      'Clear your browser cache',
      'Try a different browser',
      'Contact support if the problem persists',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.USER_NOT_FOUND]: {
    code: AuthErrorCode.USER_NOT_FOUND,
    message: 'No account found with this email',
    action: 'create_account',
    nextSteps: [
      'Check that you entered the correct email',
      "Create a new account if you don't have one",
      'Try a different email address',
      'Contact support for account recovery',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: {
    code: AuthErrorCode.EMAIL_NOT_VERIFIED,
    message: 'Your email address has not been verified',
    action: 'verify_email',
    nextSteps: [
      'Check your email for a verification link',
      'Look in your spam or junk folder',
      'Request a new verification email',
      'Contact support if you need help',
    ],
    isRetryable: true,
  },
  [AuthErrorCode.INVALID_TOKEN]: {
    code: AuthErrorCode.INVALID_TOKEN,
    message: 'Invalid or expired link',
    action: 'request_new_link',
    nextSteps: [
      'Request a new password reset link',
      "Make sure you're using the latest link sent to your email",
      "Check that your link hasn't expired",
      'Try again in a few minutes',
    ],
    isRetryable: true,
  },
};

/**
 * Error mapping service
 */
export class ErrorMappingService {
  /**
   * Map Supabase error to our error code
   */
  mapSupabaseError(supabaseError: unknown): AuthErrorCode {
    const errorMessage =
      (supabaseError as { message?: string })?.message?.toLowerCase() || '';

    // Try to find matching error code
    for (const [key, code] of Object.entries(supabaseErrorMapping)) {
      if (errorMessage.includes(key)) {
        return code;
      }
    }

    // Handle network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection')
    ) {
      return AuthErrorCode.NETWORK_ERROR;
    }

    // Default to internal error
    return AuthErrorCode.INTERNAL_ERROR;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyError(
    errorCode: AuthErrorCode,
    action: AuthAction = AuthAction.LOGIN
  ): UserFriendlyError {
    const error = errorMessages[errorCode];

    return {
      ...error,
      action: action,
    };
  }

  /**
   * Extract error from Supabase response and convert to user-friendly error
   */
  mapAndFormatError(
    supabaseError: unknown,
    action: AuthAction = AuthAction.LOGIN
  ): UserFriendlyError {
    const errorCode = this.mapSupabaseError(supabaseError);
    return this.getUserFriendlyError(errorCode, action);
  }

  /**
   * Check if error is retryable
   */
  isRetryable(errorCode: AuthErrorCode): boolean {
    const error = errorMessages[errorCode];
    return error?.isRetryable ?? true;
  }
}

/**
 * Singleton instance
 */
export const errorMappingService = new ErrorMappingService();

/**
 * Helper function to get Supabase error mapping (compatibility function)
 */
export function getSupabaseErrorMapping(
  errorCode: string,
  action: AuthAction = AuthAction.LOGIN
): UserFriendlyError {
  return errorMappingService.mapAndFormatError({ message: errorCode }, action);
}
