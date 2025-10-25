import { redis } from '@/lib/redis';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix: string; // Redis key prefix
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyPrefix: 'rate_limit:',
};

/**
 * Check if request is within rate limit
 */
export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const key = `${finalConfig.keyPrefix}${identifier}`;
  const now = Date.now();
  const _windowStart = now - finalConfig.windowMs;

  try {
    // Get current request count
    const currentCount = await redis.get(key);
    const count = currentCount ? parseInt(currentCount) : 0;

    if (count >= finalConfig.maxRequests) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + ttl * 1000,
        retryAfter: ttl,
      };
    }

    // Increment counter
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, Math.ceil(finalConfig.windowMs / 1000));
    await multi.exec();

    return {
      allowed: true,
      remaining: finalConfig.maxRequests - count - 1,
      resetTime: now + finalConfig.windowMs,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: finalConfig.maxRequests,
      resetTime: now + finalConfig.windowMs,
    };
  }
}

/**
 * Rate limiter for sync operations
 */
export async function checkSyncRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 syncs per hour
    keyPrefix: 'sync_rate_limit:',
  });
}

/**
 * Rate limiter for API requests
 */
export async function checkApiRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyPrefix: 'api_rate_limit:',
  });
}

/**
 * Rate limiter for gomafia.pro requests
 */
export async function checkGomafiaRateLimit(): Promise<RateLimitResult> {
  return checkRateLimit('gomafia', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute to gomafia.pro
    keyPrefix: 'gomafia_rate_limit:',
  });
}

/**
 * Middleware for rate limiting
 */
export function createRateLimitMiddleware(
  config: Partial<RateLimitConfig> = {}
) {
  return async (
    _req: Request,
    identifier: string
  ): Promise<Response | null> => {
    const result = await checkRateLimit(identifier, config);

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': config.maxRequests?.toString() || '10',
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      );
    }

    return null; // Allow request to continue
  };
}

/**
 * Get rate limit status for an identifier
 */
export async function getRateLimitStatus(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{
  current: number;
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const key = `${finalConfig.keyPrefix}${identifier}`;

  try {
    const current = await redis.get(key);
    const count = parseInt(current || '0');
    const ttl = await redis.ttl(key);
    const resetTime = Date.now() + ttl * 1000;

    return {
      current: count,
      limit: finalConfig.maxRequests,
      remaining: Math.max(0, finalConfig.maxRequests - count),
      resetTime,
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return {
      current: 0,
      limit: finalConfig.maxRequests,
      remaining: finalConfig.maxRequests,
      resetTime: Date.now() + finalConfig.windowMs,
    };
  }
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const key = `${finalConfig.keyPrefix}${identifier}`;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
  }
}

/**
 * Get all rate limit keys
 */
export async function getAllRateLimitKeys(): Promise<string[]> {
  try {
    return await redis.keys('rate_limit:*');
  } catch (error) {
    console.error('Failed to get rate limit keys:', error);
    return [];
  }
}

/**
 * Clear all rate limits
 */
export async function clearAllRateLimits(): Promise<void> {
  try {
    const keys = await redis.keys('rate_limit:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Failed to clear rate limits:', error);
  }
}
