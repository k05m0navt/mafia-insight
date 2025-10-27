/**
 * Error handling utilities
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

/**
 * Error response formatter
 */
export function formatErrorResponse(error: Error): {
  error: string;
  message: string;
  code: string;
  details?: Record<string, any>;
} {
  if (error instanceof AppError) {
    return {
      error: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  // Handle unknown errors
  return {
    error: 'InternalServerError',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
    code: 'INTERNAL_ERROR',
  };
}

/**
 * Error logger
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred:', errorInfo);
  } else {
    // In production, you might want to send this to a logging service
    console.error('Error occurred:', errorInfo);
  }
}

/**
 * Async error handler wrapper
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return fn(...args).catch((error) => {
      logError(error, { args });
      throw error;
    });
  };
}

/**
 * Error boundary for React components
 */
export function isError(error: any): error is Error {
  return error instanceof Error;
}
