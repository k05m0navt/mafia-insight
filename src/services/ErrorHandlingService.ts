/**
 * Error Handling Service
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, unknown>;
}

export class ErrorHandlingService {
  handleError(error: ErrorInfo): void {
    console.error('Error handled:', error);
  }

  formatError(error: Error): ErrorInfo {
    return {
      message: error.message,
      code: error.name,
      stack: error.stack,
    };
  }

  isRetryableError(error: ErrorInfo): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVICE_UNAVAILABLE',
    ];
    return retryableCodes.includes(error.code || '');
  }

  getErrorMessage(error: ErrorInfo): string {
    return error.message || 'An unknown error occurred';
  }
}

export const errorHandlingService = new ErrorHandlingService();
