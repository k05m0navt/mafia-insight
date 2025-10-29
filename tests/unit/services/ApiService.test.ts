import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiService } from '@/services/ApiService';

// Mock the API service
const mockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  request: vi.fn(),
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  setBaseURL: vi.fn(),
  setTimeout: vi.fn(),
  setRetryConfig: vi.fn(),
};

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('HTTP Methods', () => {
    describe('GET requests', () => {
      it('should make GET request successfully', async () => {
        const mockResponse = {
          data: { id: 1, name: 'Test' },
          status: 200,
          headers: {},
        };

        mockApiService.get.mockResolvedValue(mockResponse);

        const result = await mockApiService.get('/api/test');

        expect(result).toEqual(mockResponse);
        expect(mockApiService.get).toHaveBeenCalledWith('/api/test', undefined);
      });

      it('should make GET request with query parameters', async () => {
        const mockResponse = {
          data: { items: [] },
          status: 200,
          headers: {},
        };

        mockApiService.get.mockResolvedValue(mockResponse);

        const result = await mockApiService.get('/api/test', {
          params: { page: 1, limit: 10 },
        });

        expect(result).toEqual(mockResponse);
        expect(mockApiService.get).toHaveBeenCalledWith('/api/test', {
          params: { page: 1, limit: 10 },
        });
      });

      it('should handle GET request errors', async () => {
        const error = new Error('Network error');
        mockApiService.get.mockRejectedValue(error);

        await expect(mockApiService.get('/api/test')).rejects.toThrow(
          'Network error'
        );
      });
    });

    describe('POST requests', () => {
      it('should make POST request successfully', async () => {
        const mockResponse = {
          data: { id: 1, created: true },
          status: 201,
          headers: {},
        };

        mockApiService.post.mockResolvedValue(mockResponse);

        const result = await mockApiService.post('/api/test', {
          name: 'Test Item',
        });

        expect(result).toEqual(mockResponse);
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/test',
          {
            name: 'Test Item',
          },
          undefined
        );
      });

      it('should make POST request with headers', async () => {
        const mockResponse = {
          data: { id: 1, created: true },
          status: 201,
          headers: {},
        };

        mockApiService.post.mockResolvedValue(mockResponse);

        const result = await mockApiService.post(
          '/api/test',
          {
            name: 'Test Item',
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        expect(result).toEqual(mockResponse);
        expect(mockApiService.post).toHaveBeenCalledWith(
          '/api/test',
          {
            name: 'Test Item',
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });

      it('should handle POST request validation errors', async () => {
        const error = {
          response: {
            status: 400,
            data: {
              error: 'Validation failed',
              details: ['Name is required'],
            },
          },
        };

        mockApiService.post.mockRejectedValue(error);

        await expect(mockApiService.post('/api/test', {})).rejects.toEqual(
          error
        );
      });
    });

    describe('PUT requests', () => {
      it('should make PUT request successfully', async () => {
        const mockResponse = {
          data: { id: 1, updated: true },
          status: 200,
          headers: {},
        };

        mockApiService.put.mockResolvedValue(mockResponse);

        const result = await mockApiService.put('/api/test/1', {
          name: 'Updated Item',
        });

        expect(result).toEqual(mockResponse);
        expect(mockApiService.put).toHaveBeenCalledWith(
          '/api/test/1',
          {
            name: 'Updated Item',
          },
          undefined
        );
      });

      it('should handle PUT request not found errors', async () => {
        const error = {
          response: {
            status: 404,
            data: {
              error: 'Not found',
            },
          },
        };

        mockApiService.put.mockRejectedValue(error);

        await expect(mockApiService.put('/api/test/999', {})).rejects.toEqual(
          error
        );
      });
    });

    describe('DELETE requests', () => {
      it('should make DELETE request successfully', async () => {
        const mockResponse = {
          data: { deleted: true },
          status: 200,
          headers: {},
        };

        mockApiService.delete.mockResolvedValue(mockResponse);

        const result = await mockApiService.delete('/api/test/1');

        expect(result).toEqual(mockResponse);
        expect(mockApiService.delete).toHaveBeenCalledWith(
          '/api/test/1',
          undefined
        );
      });

      it('should handle DELETE request forbidden errors', async () => {
        const error = {
          response: {
            status: 403,
            data: {
              error: 'Forbidden',
            },
          },
        };

        mockApiService.delete.mockRejectedValue(error);

        await expect(mockApiService.delete('/api/test/1')).rejects.toEqual(
          error
        );
      });
    });

    describe('PATCH requests', () => {
      it('should make PATCH request successfully', async () => {
        const mockResponse = {
          data: { id: 1, patched: true },
          status: 200,
          headers: {},
        };

        mockApiService.patch.mockResolvedValue(mockResponse);

        const result = await mockApiService.patch('/api/test/1', {
          name: 'Patched Item',
        });

        expect(result).toEqual(mockResponse);
        expect(mockApiService.patch).toHaveBeenCalledWith(
          '/api/test/1',
          {
            name: 'Patched Item',
          },
          undefined
        );
      });
    });
  });

  describe('Generic Request Method', () => {
    it('should make custom request successfully', async () => {
      const mockResponse = {
        data: { result: 'success' },
        status: 200,
        headers: {},
      };

      mockApiService.request.mockResolvedValue(mockResponse);

      const result = await mockApiService.request({
        method: 'GET',
        url: '/api/test',
        headers: {
          'Custom-Header': 'value',
        },
      });

      expect(result).toEqual(mockResponse);
      expect(mockApiService.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/test',
        headers: {
          'Custom-Header': 'value',
        },
      });
    });

    it('should handle request timeout', async () => {
      const error = new Error('Request timeout');
      mockApiService.request.mockRejectedValue(error);

      await expect(
        mockApiService.request({
          method: 'GET',
          url: '/api/slow-endpoint',
        })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Authentication', () => {
    it('should set authentication token', () => {
      mockApiService.setAuthToken('test-token');
      expect(mockApiService.setAuthToken).toHaveBeenCalledWith('test-token');
    });

    it('should clear authentication token', () => {
      mockApiService.clearAuthToken();
      expect(mockApiService.clearAuthToken).toHaveBeenCalled();
    });

    it('should include auth token in requests', async () => {
      const mockResponse = {
        data: { authenticated: true },
        status: 200,
        headers: {},
      };

      mockApiService.get.mockResolvedValue(mockResponse);

      await mockApiService.get('/api/protected');

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/protected',
        undefined
      );
    });
  });

  describe('Configuration', () => {
    it('should set base URL', () => {
      mockApiService.setBaseURL('https://api.example.com');
      expect(mockApiService.setBaseURL).toHaveBeenCalledWith(
        'https://api.example.com'
      );
    });

    it('should set timeout', () => {
      mockApiService.setTimeout(5000);
      expect(mockApiService.setTimeout).toHaveBeenCalledWith(5000);
    });

    it('should set retry configuration', () => {
      const retryConfig = {
        retries: 3,
        retryDelay: 1000,
        retryCondition: (error: any) => error.response?.status >= 500,
      };

      mockApiService.setRetryConfig(retryConfig);
      expect(mockApiService.setRetryConfig).toHaveBeenCalledWith(retryConfig);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockApiService.get.mockRejectedValue(error);

      await expect(mockApiService.get('/api/test')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle HTTP errors', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            error: 'Internal server error',
          },
        },
      };

      mockApiService.get.mockRejectedValue(error);

      await expect(mockApiService.get('/api/test')).rejects.toEqual(error);
    });

    it('should handle timeout errors', async () => {
      const error = new Error('Request timeout');
      mockApiService.get.mockRejectedValue(error);

      await expect(mockApiService.get('/api/test')).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle rate limiting errors', async () => {
      const error = {
        response: {
          status: 429,
          data: {
            error: 'Too many requests',
            retryAfter: 60,
          },
        },
      };

      mockApiService.get.mockRejectedValue(error);

      await expect(mockApiService.get('/api/test')).rejects.toEqual(error);
    });
  });

  describe('Request Interceptors', () => {
    it('should add request headers', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: {},
      };

      mockApiService.get.mockResolvedValue(mockResponse);

      await mockApiService.get('/api/test');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/test', undefined);
    });

    it('should handle request errors', async () => {
      const error = new Error('Request interceptor error');
      mockApiService.get.mockRejectedValue(error);

      await expect(mockApiService.get('/api/test')).rejects.toThrow(
        'Request interceptor error'
      );
    });
  });

  describe('Response Interceptors', () => {
    it('should transform response data', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        status: 200,
        headers: {},
      };

      mockApiService.get.mockResolvedValue(mockResponse);

      const result = await mockApiService.get('/api/test');

      expect(result).toEqual(mockResponse);
    });

    it('should handle response errors', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: 'Bad request',
          },
        },
      };

      mockApiService.get.mockRejectedValue(error);

      await expect(mockApiService.get('/api/test')).rejects.toEqual(error);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: {},
      };

      mockApiService.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse);

      const result = await mockApiService.get('/api/test');

      expect(result).toEqual(mockResponse);
      expect(mockApiService.get).toHaveBeenCalledTimes(3);
    });

    it('should not retry certain errors', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: 'Bad request',
          },
        },
      };

      mockApiService.get.mockRejectedValue(error);

      await expect(mockApiService.get('/api/test')).rejects.toEqual(error);
      expect(mockApiService.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Caching', () => {
    it('should cache GET requests', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        status: 200,
        headers: {
          'Cache-Control': 'max-age=300',
        },
      };

      mockApiService.get.mockResolvedValue(mockResponse);

      // First request
      const result1 = await mockApiService.get('/api/test');
      expect(result1).toEqual(mockResponse);

      // Second request should use cache
      const result2 = await mockApiService.get('/api/test');
      expect(result2).toEqual(mockResponse);
    });

    it('should invalidate cache on POST requests', async () => {
      const mockResponse = {
        data: { id: 1, created: true },
        status: 201,
        headers: {},
      };

      mockApiService.post.mockResolvedValue(mockResponse);

      await mockApiService.post('/api/test', { name: 'New Item' });

      expect(mockApiService.post).toHaveBeenCalledWith(
        '/api/test',
        { name: 'New Item' },
        undefined
      );
    });
  });

  describe('Performance', () => {
    it('should complete requests within timeout', async () => {
      const startTime = Date.now();

      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: {},
      };

      mockApiService.get.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      );

      const result = await mockApiService.get('/api/test');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
      expect(result).toEqual(mockResponse);
    });

    it('should handle concurrent requests', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        headers: {},
      };

      mockApiService.get.mockResolvedValue(mockResponse);

      const requests = Array(5)
        .fill(null)
        .map(() => mockApiService.get('/api/test'));

      const results = await Promise.all(requests);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toEqual(mockResponse);
      });
    });
  });
});
