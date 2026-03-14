import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  const headers = {
    // Prevent XSS attacks
    'X-XSS-Protection': '1; mode=block',
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Referrer policy for privacy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss: http: https:",
      "frame-ancestors 'none'",
    ].join('; '),
    // Permissions Policy (modern browsers)
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
    ].join(', '),
  };

  // Apply headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // HSTS (only on production)
  const host = request.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
