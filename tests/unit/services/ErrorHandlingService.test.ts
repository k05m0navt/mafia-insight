import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandlingService } from '@/services/ErrorHandlingService';

describe('ErrorHandlingService', () => {
  let errorHandlingService: ErrorHandlingService;

  beforeEach(() => {
    errorHandlingService = new ErrorHandlingService();
  });

  describe('Error Detection', () => {
    it('should detect network errors', () => {
      const error = new Error('Network request failed');
      const result = errorHandlingService.detectErrorType(error);
      expect(result).toBe('network');
    });

    it('should detect server errors', () => {
      const error = new Error('Internal server error');
      const result = errorHandlingService.detectErrorType(error);
      expect(result).toBe('server');
    });

    it('should detect authentication errors', () => {
      const error = new Error('Unauthorized');
      const result = errorHandlingService.detectErrorType(error);
      expect(result).toBe('authentication');
    });

    it('should detect validation errors', () => {
      const error = new Error('Validation failed');
      const result = errorHandlingService.detectErrorType(error);
      expect(result).toBe('validation');
    });

    it('should detect timeout errors', () => {
      const error = new Error('Request timeout');
      const result = errorHandlingService.detectErrorType(error);
      expect(result).toBe('timeout');
    });
  });

  describe('Error Recovery', () => {
    it('should retry network errors', async () => {
      const error = new Error('Network request failed');
      const result = await errorHandlingService.recoverFromError(error);
      expect(result).toHaveProperty('retryAttempted', true);
    });

    it('should fallback for server errors', async () => {
      const error = new Error('Internal server error');
      const result = await errorHandlingService.recoverFromError(error);
      expect(result).toHaveProperty('fallbackActivated', true);
    });

    it('should refresh token for authentication errors', async () => {
      const error = new Error('Unauthorized');
      const result = await errorHandlingService.recoverFromError(error);
      expect(result).toHaveProperty('tokenRefreshed', true);
    });

    it('should validate data for validation errors', async () => {
      const error = new Error('Validation failed');
      const result = await errorHandlingService.recoverFromError(error);
      expect(result).toHaveProperty('dataValidated', true);
    });
  });

  describe('Error Logging', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      const result = errorHandlingService.logError(error, context);
      expect(result).toHaveProperty('errorId');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('context', context);
    });

    it('should include error metrics', () => {
      const error = new Error('Test error');
      const result = errorHandlingService.logError(error);
      expect(result).toHaveProperty('metrics');
      expect(result.metrics).toHaveProperty('severity');
      expect(result.metrics).toHaveProperty('category');
    });
  });
});
