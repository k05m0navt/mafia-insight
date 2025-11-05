import { useCallback, useRef } from 'react';

/**
 * Simple in-memory cache for API responses
 * Reduces duplicate API calls when navigating between pages
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

/**
 * Hook to cache API responses and avoid duplicate requests
 *
 * @example
 * const { fetchWithCache } = useApiCache();
 * const data = await fetchWithCache('/api/players?page=1');
 */
export function useApiCache() {
  const activeRequests = useRef<Map<string, Promise<unknown>>>(new Map());

  const fetchWithCache = useCallback(
    async <T>(url: string, options?: RequestInit): Promise<T> => {
      // Check cache first
      const cached = cache.get(url);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data as T;
      }

      // Check if there's already an active request for this URL
      const activeRequest = activeRequests.current.get(url);
      if (activeRequest) {
        return activeRequest as Promise<T>;
      }

      // Create new request
      const requestPromise = fetch(url, options)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();

          // Cache the response
          cache.set(url, {
            data,
            timestamp: Date.now(),
          });

          return data;
        })
        .finally(() => {
          // Remove from active requests when done
          activeRequests.current.delete(url);
        });

      // Track active request
      activeRequests.current.set(url, requestPromise);

      return requestPromise as Promise<T>;
    },
    []
  );

  const clearCache = useCallback((url?: string) => {
    if (url) {
      cache.delete(url);
    } else {
      cache.clear();
    }
  }, []);

  return { fetchWithCache, clearCache };
}
