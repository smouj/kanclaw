import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
// For production, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // max requests per window

export function rateLimit(request: NextRequest): { success: boolean; remaining: number; resetTime: number } {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return { success: true, remaining: MAX_REQUESTS - 1, resetTime: now + WINDOW_MS };
  }
  
  if (record.count >= MAX_REQUESTS) {
    // Rate limited
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }
  
  // Increment
  record.count++;
  return { success: true, remaining: MAX_REQUESTS - record.count, resetTime: record.resetTime };
}

export function withRateLimit(request: NextRequest): NextResponse | null {
  const { success, remaining, resetTime } = rateLimit(request);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        }
      }
    );
  }
  
  return null; // Allow request
}
