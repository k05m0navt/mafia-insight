export interface ErrorDetails {
  message: string;
  code: string;
  field?: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  public code: string;
  public field?: string;
  public timestamp: Date;
  public context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    field?: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.field = field;
    this.timestamp = new Date();
    this.context = context;
  }

  toJSON(): ErrorDetails {
    return {
      message: this.message,
      code: this.code,
      field: this.field,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', field, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', undefined, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', undefined, context);
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', undefined, context);
    this.name = 'NetworkError';
  }
}

export class ThemeError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'THEME_ERROR', undefined, context);
    this.name = 'ThemeError';
  }
}

export class NavigationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NAVIGATION_ERROR', undefined, context);
    this.name = 'NavigationError';
  }
}

export const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  WEAK_PASSWORD: 'Password is too weak',
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  ACCOUNT_NOT_FOUND: 'Account not found',
  SESSION_EXPIRED: 'Your session has expired',

  // Authorization errors
  ACCESS_DENIED: 'You do not have permission to access this resource',
  ADMIN_REQUIRED: 'Administrator access required',
  LOGIN_REQUIRED: 'Please log in to access this page',

  // Validation errors
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  MIN_LENGTH: 'Must be at least {min} characters',
  MAX_LENGTH: 'Must be no more than {max} characters',
  INVALID_VALUE: 'Invalid value',

  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',

  // Theme errors
  THEME_SAVE_FAILED: 'Failed to save theme preference',
  THEME_LOAD_FAILED: 'Failed to load theme preference',
  INVALID_THEME: 'Invalid theme value',

  // Navigation errors
  PAGE_NOT_FOUND: 'Page not found',
  NAVIGATION_FAILED: 'Navigation failed',
  INVALID_ROUTE: 'Invalid route',

  // General errors
  UNKNOWN_ERROR: 'An unknown error occurred',
  OPERATION_FAILED: 'Operation failed',
  RETRY_REQUIRED: 'Please try again',
};

export const getUserFriendlyMessage = (error: Error | AppError): string => {
  if (error instanceof AppError) {
    return (
      ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message
    );
  }

  if (error.message.includes('Network')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error.message.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

export const getErrorCode = (error: Error | AppError): string => {
  if (error instanceof AppError) {
    return error.code;
  }

  if (error.message.includes('Network')) {
    return 'NETWORK_ERROR';
  }

  if (error.message.includes('timeout')) {
    return 'TIMEOUT_ERROR';
  }

  return 'UNKNOWN_ERROR';
};

export const isRetryableError = (error: Error | AppError): boolean => {
  if (error instanceof AppError) {
    return ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR'].includes(
      error.code
    );
  }

  return error.message.includes('Network') || error.message.includes('timeout');
};

export const getErrorContext = (
  error: Error | AppError
): Record<string, unknown> => {
  if (error instanceof AppError) {
    return error.context || {};
  }

  return {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };
};

export const logError = (
  error: Error | AppError,
  context?: Record<string, unknown>
): void => {
  const errorDetails = {
    message: error.message,
    code: getErrorCode(error),
    context: { ...getErrorContext(error), ...context },
    timestamp: new Date().toISOString(),
    userAgent:
      typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  };

  console.error('Application Error:', errorDetails);

  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorTrackingService(errorDetails);
  }
};

export const createErrorHandler = (context?: Record<string, unknown>) => {
  return (error: Error | AppError) => {
    logError(error, context);
    return getUserFriendlyMessage(error);
  };
};

export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  errorHandler?: (error: Error) => void
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error as Error);
    } else {
      logError(error as Error);
    }
    return null;
  }
};

export const formatErrorResponse = (
  error: Error | AppError,
  statusCode: number = 500
) => {
  const message = getUserFriendlyMessage(error);
  const code = getErrorCode(error);
  const context = getErrorContext(error);

  return {
    message,
    code,
    statusCode,
    context,
    timestamp: new Date().toISOString(),
  };
};
