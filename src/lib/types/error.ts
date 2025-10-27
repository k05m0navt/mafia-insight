/**
 * Base error interface
 */
export interface BaseError {
  code: string;
  message: string;
  userMessage?: string;
  context?: Record<string, unknown>;
}

/**
 * API error interface
 */
export interface ApiError extends BaseError {
  statusCode: number;
  timestamp: Date;
}

/**
 * Validation error interface
 */
export interface ValidationError extends BaseError {
  field: string;
  value?: unknown;
  constraints?: Record<string, string>;
}

/**
 * Authentication error interface
 */
export interface AuthenticationError extends BaseError {
  userId?: string;
  action: string;
  resolved: boolean;
  createdAt: Date;
}

/**
 * Database error interface
 */
export interface DatabaseError extends BaseError {
  query?: string;
  table?: string;
  constraint?: string;
}

/**
 * Network error interface
 */
export interface NetworkError extends BaseError {
  url: string;
  method: string;
  statusCode?: number;
}

/**
 * Permission error interface
 */
export interface PermissionError extends BaseError {
  resource: string;
  action: string;
  requiredRole?: string;
}

/**
 * Rate limit error interface
 */
export interface RateLimitError extends BaseError {
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * File upload error interface
 */
export interface FileUploadError extends BaseError {
  fileName: string;
  fileSize?: number;
  fileType?: string;
}

/**
 * Generic error types
 */
export type AppError =
  | BaseError
  | ApiError
  | ValidationError
  | AuthenticationError
  | DatabaseError
  | NetworkError
  | PermissionError
  | RateLimitError
  | FileUploadError;

/**
 * Error context interface
 */
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
  environment: string;
  [key: string]: unknown;
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  error: AppError;
  context: ErrorContext;
}

/**
 * Form field error interface
 */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Form errors interface
 */
export interface FormErrors {
  [field: string]: FieldError;
}

/**
 * Error boundary state interface
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: unknown;
}
