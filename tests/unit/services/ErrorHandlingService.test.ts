import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ErrorHandlingService,
  errorHandlingService,
} from '@/services/ErrorHandlingService';

describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = errorHandlingService;
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('formats native errors into ErrorInfo structures', () => {
    const error = new Error('Something went wrong');
    error.name = 'TEST_ERROR';

    const formatted = service.formatError(error);

    expect(formatted.message).toBe('Something went wrong');
    expect(formatted.code).toBe('TEST_ERROR');
    expect(formatted.stack).toContain('Something went wrong');
  });

  it('identifies retryable error codes', () => {
    expect(
      service.isRetryableError({ message: 'Temporary', code: 'NETWORK_ERROR' })
    ).toBe(true);
    expect(
      service.isRetryableError({
        message: 'Timeout happening',
        code: 'TIMEOUT_ERROR',
      })
    ).toBe(true);
    expect(
      service.isRetryableError({
        message: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      })
    ).toBe(true);
    expect(service.isRetryableError({ message: 'Validation failed' })).toBe(
      false
    );
  });

  it('returns user-facing error messages', () => {
    expect(service.getErrorMessage({ message: 'Custom error message' })).toBe(
      'Custom error message'
    );
    expect(service.getErrorMessage({ message: '' })).toBe(
      'An unknown error occurred'
    );
  });

  it('logs handled errors to the console', () => {
    const errorInfo = { message: 'Handled error', code: 'NETWORK_ERROR' };

    service.handleError(errorInfo);

    expect(consoleSpy).toHaveBeenCalledWith('Error handled:', errorInfo);
  });
});
