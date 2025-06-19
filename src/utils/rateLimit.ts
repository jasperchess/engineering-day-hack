import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class RateLimit {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request should be rate limited
   * @param identifier Unique identifier for the client (IP, user ID, etc.)
   * @returns Object with allowed status and remaining requests
   */
  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    total: number;
  } {
    const now = Date.now();
    const resetTime = now + this.config.windowMs;
    
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime,
      };
      rateLimitStore.set(identifier, newEntry);

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime,
        total: this.config.maxRequests,
      };
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        total: this.config.maxRequests,
      };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      total: this.config.maxRequests,
    };
  }

  /**
   * Get rate limit headers for HTTP response
   */
  getHeaders(result: ReturnType<typeof this.check>): Record<string, string> {
    return {
      "X-RateLimit-Limit": result.total.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
    };
  }
}

/**
 * Get client identifier for rate limiting
 * Priority: User ID > IP Address > Fallback
 */
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : 
             request.headers.get("x-real-ip") || 
             "unknown";

  return `ip:${ip}`;
}

// Predefined rate limiters for different use cases
export const uploadRateLimit = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 uploads per 15 minutes per user
});

export const apiRateLimit = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 API calls per 15 minutes per user
});

export const strictUploadRateLimit = new RateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute per user
});