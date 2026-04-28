import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
// For production, replace with Redis-based solution
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private maxRequests: number = 100 // requests per window
  ) {}

  isRateLimited(identifier: string): { limited: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const userRequests = this.requests.get(identifier);

    if (!userRequests || now > userRequests.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { limited: false, remaining: this.maxRequests - 1 };
    }

    if (userRequests.count >= this.maxRequests) {
      return {
        limited: true,
        resetTime: userRequests.resetTime,
        remaining: 0
      };
    }

    userRequests.count++;
    return {
      limited: false,
      remaining: this.maxRequests - userRequests.count
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Create rate limiters for different endpoints
const chatRateLimiter = new RateLimiter(15 * 60 * 1000, 50); // 50 requests per 15 minutes for chat
const statusRateLimiter = new RateLimiter(60 * 1000, 10); // 10 requests per minute for status

// Cleanup old entries every 5 minutes
setInterval(() => {
  chatRateLimiter.cleanup();
  statusRateLimiter.cleanup();
}, 5 * 60 * 1000);

export function checkRateLimit(
  request: NextRequest,
  limiter: RateLimiter,
  endpoint: string
): NextResponse | null {
  // Get client identifier (IP address)
  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  const result = limiter.isRateLimited(`${endpoint}:${clientIP}`);

  if (result.limited) {
    const resetTime = result.resetTime ? new Date(result.resetTime) : new Date();
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests to ${endpoint}. Please try again later.`,
        retryAfter: Math.ceil((result.resetTime! - Date.now()) / 1000),
        cyberpunk: {
          warningGlow: true,
          matrixWarning: 'RATE_LIMIT_EXCEEDED',
          systemStatus: 'PROTECTED'
        }
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.resetTime! - Date.now()) / 1000).toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toISOString()
        }
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', result.remaining?.toString() || '0');
  if (result.resetTime) {
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
  }

  return null; // No rate limit violation
}

export { chatRateLimiter, statusRateLimiter };