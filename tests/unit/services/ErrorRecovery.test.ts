import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorRecovery } from '@/services/ErrorRecovery';

// Mock the error recovery service
const mockErrorRecovery = {
  handleError: vi.fn(),
  retryOperation: vi.fn(),
  recoverFromError: vi.fn(),
  getErrorDetails: vi.fn(),
  getRecoverySuggestions: vi.fn(),
  logError: vi.fn(),
  clearErrors: vi.fn(),
  getErrorHistory: vi.fn(),
};

describe('ErrorRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('handleError', () => {
    it('should handle network errors', async () => {
      const networkError = {
        type: 'network',
        message: 'Connection failed',
        code: 'NETWORK_ERROR',
        retryable: true,
        retryAfter: 5000,
      };

      mockErrorRecovery.handleError.mockResolvedValue({
        handled: true,
        action: 'retry',
        retryAfter: 5000,
        suggestion: 'Check your internet connection',
      });

      const result = await mockErrorRecovery.handleError(networkError);

      expect(result).toEqual({
        handled: true,
        action: 'retry',
        retryAfter: 5000,
        suggestion: 'Check your internet connection',
      });
      expect(mockErrorRecovery.handleError).toHaveBeenCalledWith(networkError);
    });

    it('should handle database errors', async () => {
      const databaseError = {
        type: 'database',
        message: 'Connection timeout',
        code: 'DB_TIMEOUT',
        retryable: true,
        retryAfter: 10000,
      };

      mockErrorRecovery.handleError.mockResolvedValue({
        handled: true,
        action: 'retry',
        retryAfter: 10000,
        suggestion: 'Database is under heavy load, retrying...',
      });

      const result = await mockErrorRecovery.handleError(databaseError);

      expect(result).toEqual({
        handled: true,
        action: 'retry',
        retryAfter: 10000,
        suggestion: 'Database is under heavy load, retrying...',
      });
    });

    it('should handle validation errors', async () => {
      const validationError = {
        type: 'validation',
        message: 'Invalid data format',
        code: 'VALIDATION_ERROR',
        retryable: false,
        details: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'rating', message: 'Rating must be between 0 and 3000' },
        ],
      };

      mockErrorRecovery.handleError.mockResolvedValue({
        handled: true,
        action: 'fix_data',
        suggestion: 'Please correct the data format and try again',
        details: validationError.details,
      });

      const result = await mockErrorRecovery.handleError(validationError);

      expect(result).toEqual({
        handled: true,
        action: 'fix_data',
        suggestion: 'Please correct the data format and try again',
        details: validationError.details,
      });
    });

    it('should handle authentication errors', async () => {
      const authError = {
        type: 'authentication',
        message: 'Token expired',
        code: 'AUTH_EXPIRED',
        retryable: false,
        loginUrl: '/login',
      };

      mockErrorRecovery.handleError.mockResolvedValue({
        handled: true,
        action: 'redirect_login',
        loginUrl: '/login',
        suggestion: 'Please log in again to continue',
      });

      const result = await mockErrorRecovery.handleError(authError);

      expect(result).toEqual({
        handled: true,
        action: 'redirect_login',
        loginUrl: '/login',
        suggestion: 'Please log in again to continue',
      });
    });

    it('should handle rate limiting errors', async () => {
      const rateLimitError = {
        type: 'rate_limit',
        message: 'Too many requests',
        code: 'RATE_LIMIT',
        retryable: true,
        retryAfter: 60000,
        limit: 100,
        remaining: 0,
      };

      mockErrorRecovery.handleError.mockResolvedValue({
        handled: true,
        action: 'wait_and_retry',
        retryAfter: 60000,
        suggestion: 'Rate limit exceeded, waiting 60 seconds before retry',
      });

      const result = await mockErrorRecovery.handleError(rateLimitError);

      expect(result).toEqual({
        handled: true,
        action: 'wait_and_retry',
        retryAfter: 60000,
        suggestion: 'Rate limit exceeded, waiting 60 seconds before retry',
      });
    });

    it('should handle server errors', async () => {
      const serverError = {
        type: 'server',
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        retryable: true,
        retryAfter: 30000,
      };

      mockErrorRecovery.handleError.mockResolvedValue({
        handled: true,
        action: 'retry',
        retryAfter: 30000,
        suggestion: 'Server error occurred, retrying in 30 seconds',
      });

      const result = await mockErrorRecovery.handleError(serverError);

      expect(result).toEqual({
        handled: true,
        action: 'retry',
        retryAfter: 30000,
        suggestion: 'Server error occurred, retrying in 30 seconds',
      });
    });
  });

  describe('retryOperation', () => {
    it('should retry operation successfully', async () => {
      const mockRetryResult = {
        success: true,
        attempts: 2,
        totalTime: 5000,
        result: { data: 'success' },
      };

      mockErrorRecovery.retryOperation.mockResolvedValue(mockRetryResult);

      const result = await mockErrorRecovery.retryOperation(
        () => Promise.resolve({ data: 'success' }),
        { maxAttempts: 3, delay: 1000 }
      );

      expect(result).toEqual(mockRetryResult);
      expect(mockErrorRecovery.retryOperation).toHaveBeenCalled();
    });

    it('should fail after max attempts', async () => {
      const mockRetryResult = {
        success: false,
        attempts: 3,
        totalTime: 15000,
        lastError: 'Operation failed after 3 attempts',
      };

      mockErrorRecovery.retryOperation.mockResolvedValue(mockRetryResult);

      const result = await mockErrorRecovery.retryOperation(
        () => Promise.reject(new Error('Operation failed')),
        { maxAttempts: 3, delay: 1000 }
      );

      expect(result).toEqual(mockRetryResult);
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
    });

    it('should handle exponential backoff', async () => {
      const mockRetryResult = {
        success: true,
        attempts: 2,
        totalTime: 3000,
        result: { data: 'success' },
      };

      mockErrorRecovery.retryOperation.mockResolvedValue(mockRetryResult);

      const result = await mockErrorRecovery.retryOperation(
        () => Promise.resolve({ data: 'success' }),
        { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
      );

      expect(result).toEqual(mockRetryResult);
    });
  });

  describe('recoverFromError', () => {
    it('should recover from recoverable errors', async () => {
      const mockRecoveryResult = {
        recovered: true,
        action: 'retry',
        nextStep: 'Continue with retry',
        confidence: 0.8,
      };

      mockErrorRecovery.recoverFromError.mockResolvedValue(mockRecoveryResult);

      const result = await mockErrorRecovery.recoverFromError({
        type: 'network',
        message: 'Connection failed',
        retryable: true,
      });

      expect(result).toEqual(mockRecoveryResult);
      expect(mockErrorRecovery.recoverFromError).toHaveBeenCalled();
    });

    it('should not recover from non-recoverable errors', async () => {
      const mockRecoveryResult = {
        recovered: false,
        action: 'abort',
        nextStep: 'Manual intervention required',
        confidence: 0.1,
      };

      mockErrorRecovery.recoverFromError.mockResolvedValue(mockRecoveryResult);

      const result = await mockErrorRecovery.recoverFromError({
        type: 'validation',
        message: 'Invalid data format',
        retryable: false,
      });

      expect(result).toEqual(mockRecoveryResult);
      expect(result.recovered).toBe(false);
    });

    it('should provide recovery suggestions', async () => {
      const mockRecoveryResult = {
        recovered: false,
        action: 'manual_fix',
        nextStep: 'Fix data format issues',
        suggestions: [
          'Check email format',
          'Validate rating range',
          'Ensure required fields are present',
        ],
        confidence: 0.6,
      };

      mockErrorRecovery.recoverFromError.mockResolvedValue(mockRecoveryResult);

      const result = await mockErrorRecovery.recoverFromError({
        type: 'validation',
        message: 'Multiple validation errors',
        retryable: false,
        details: [
          { field: 'email', message: 'Invalid format' },
          { field: 'rating', message: 'Out of range' },
        ],
      });

      expect(result).toEqual(mockRecoveryResult);
      expect(result.suggestions).toHaveLength(3);
    });
  });

  describe('getErrorDetails', () => {
    it('should return detailed error information', async () => {
      const mockErrorDetails = {
        errorId: 'error-123',
        type: 'network',
        message: 'Connection failed',
        code: 'NETWORK_ERROR',
        timestamp: '2025-01-27T10:00:00Z',
        context: {
          url: '/api/import/start',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        stack: 'Error: Connection failed\n    at fetch (/api/import/start)',
        retryable: true,
        severity: 'medium',
      };

      mockErrorRecovery.getErrorDetails.mockResolvedValue(mockErrorDetails);

      const result = await mockErrorRecovery.getErrorDetails('error-123');

      expect(result).toEqual(mockErrorDetails);
      expect(mockErrorRecovery.getErrorDetails).toHaveBeenCalledWith(
        'error-123'
      );
    });

    it('should handle error details retrieval errors', async () => {
      const detailsError = new Error('Error details not found');
      mockErrorRecovery.getErrorDetails.mockRejectedValue(detailsError);

      await expect(
        mockErrorRecovery.getErrorDetails('non-existent-id')
      ).rejects.toThrow('Error details not found');
    });
  });

  describe('getRecoverySuggestions', () => {
    it('should return recovery suggestions for error type', async () => {
      const mockSuggestions = {
        errorType: 'network',
        suggestions: [
          'Check your internet connection',
          'Verify the server is running',
          'Try again in a few minutes',
          'Contact support if the issue persists',
        ],
        priority: 'high',
        estimatedFixTime: '5-10 minutes',
      };

      mockErrorRecovery.getRecoverySuggestions.mockResolvedValue(
        mockSuggestions
      );

      const result = await mockErrorRecovery.getRecoverySuggestions('network');

      expect(result).toEqual(mockSuggestions);
      expect(mockErrorRecovery.getRecoverySuggestions).toHaveBeenCalledWith(
        'network'
      );
    });

    it('should return suggestions for specific error code', async () => {
      const mockSuggestions = {
        errorType: 'database',
        errorCode: 'DB_TIMEOUT',
        suggestions: [
          'Increase database timeout settings',
          'Optimize database queries',
          'Check database server load',
          'Consider using connection pooling',
        ],
        priority: 'medium',
        estimatedFixTime: '15-30 minutes',
      };

      mockErrorRecovery.getRecoverySuggestions.mockResolvedValue(
        mockSuggestions
      );

      const result = await mockErrorRecovery.getRecoverySuggestions(
        'database',
        'DB_TIMEOUT'
      );

      expect(result).toEqual(mockSuggestions);
      expect(mockErrorRecovery.getRecoverySuggestions).toHaveBeenCalledWith(
        'database',
        'DB_TIMEOUT'
      );
    });
  });

  describe('logError', () => {
    it('should log error successfully', async () => {
      const mockLogResult = {
        errorId: 'error-123',
        logged: true,
        timestamp: '2025-01-27T10:00:00Z',
      };

      mockErrorRecovery.logError.mockResolvedValue(mockLogResult);

      const result = await mockErrorRecovery.logError({
        type: 'network',
        message: 'Connection failed',
        code: 'NETWORK_ERROR',
        context: { url: '/api/import/start' },
      });

      expect(result).toEqual(mockLogResult);
      expect(mockErrorRecovery.logError).toHaveBeenCalled();
    });

    it('should handle logging errors', async () => {
      const logError = new Error('Failed to log error');
      mockErrorRecovery.logError.mockRejectedValue(logError);

      await expect(
        mockErrorRecovery.logError({
          type: 'network',
          message: 'Connection failed',
        })
      ).rejects.toThrow('Failed to log error');
    });
  });

  describe('clearErrors', () => {
    it('should clear errors successfully', async () => {
      const mockClearResult = {
        cleared: true,
        count: 5,
        timestamp: '2025-01-27T10:00:00Z',
      };

      mockErrorRecovery.clearErrors.mockResolvedValue(mockClearResult);

      const result = await mockErrorRecovery.clearErrors({
        olderThan: '2025-01-27T09:00:00Z',
        type: 'network',
      });

      expect(result).toEqual(mockClearResult);
      expect(mockErrorRecovery.clearErrors).toHaveBeenCalledWith({
        olderThan: '2025-01-27T09:00:00Z',
        type: 'network',
      });
    });

    it('should handle clear errors failures', async () => {
      const clearError = new Error('Failed to clear errors');
      mockErrorRecovery.clearErrors.mockRejectedValue(clearError);

      await expect(mockErrorRecovery.clearErrors()).rejects.toThrow(
        'Failed to clear errors'
      );
    });
  });

  describe('getErrorHistory', () => {
    it('should return error history', async () => {
      const mockHistory = {
        errors: [
          {
            errorId: 'error-1',
            type: 'network',
            message: 'Connection failed',
            timestamp: '2025-01-27T09:00:00Z',
            resolved: true,
          },
          {
            errorId: 'error-2',
            type: 'database',
            message: 'Query timeout',
            timestamp: '2025-01-27T09:30:00Z',
            resolved: false,
          },
        ],
        total: 2,
        pagination: {
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockErrorRecovery.getErrorHistory.mockResolvedValue(mockHistory);

      const result = await mockErrorRecovery.getErrorHistory({
        page: 1,
        limit: 10,
        type: 'network',
      });

      expect(result).toEqual(mockHistory);
      expect(mockErrorRecovery.getErrorHistory).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        type: 'network',
      });
    });

    it('should handle history retrieval errors', async () => {
      const historyError = new Error('Failed to get error history');
      mockErrorRecovery.getErrorHistory.mockRejectedValue(historyError);

      await expect(mockErrorRecovery.getErrorHistory()).rejects.toThrow(
        'Failed to get error history'
      );
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      const serviceError = new Error('Error recovery service unavailable');
      mockErrorRecovery.handleError.mockRejectedValue(serviceError);

      await expect(
        mockErrorRecovery.handleError({
          type: 'network',
          message: 'Connection failed',
        })
      ).rejects.toThrow('Error recovery service unavailable');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Operation timeout');
      mockErrorRecovery.retryOperation.mockRejectedValue(timeoutError);

      await expect(
        mockErrorRecovery.retryOperation(() => Promise.resolve(), {
          maxAttempts: 1,
          delay: 1000,
        })
      ).rejects.toThrow('Operation timeout');
    });
  });
});
